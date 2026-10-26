// El progreso de cada clase en la portada (components/Progreso.astro).

interface Tema {
  titulo: string;
  link: string;
  ejercicios?: boolean;
}
interface Grupo {
  grupo: string;
  temas: Tema[];
}
interface Ejercicio {
  titulo: string;
  id: string;
  fundamental: boolean;
  hecho: boolean;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

function hecho(ruta: string, titulo: string): boolean {
  try {
    return localStorage.getItem(`pcp:done:${ruta}::${titulo}`) === '1';
  } catch {
    return false;
  }
}

/** Pide la página del tema y lista sus ejercicios (los mismos que cuenta su barra de progreso). */
async function ejerciciosDe(ruta: string): Promise<Ejercicio[]> {
  const r = await fetch(ruta);
  if (!r.ok) return [];
  const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
  const vistos = new Set<string>();
  return [...doc.querySelectorAll<HTMLElement>('.ejercicio:not(.probador), .diagrama, .quiz, .ordenar')]
    .filter((el) => el.dataset.titulo && !vistos.has(el.dataset.titulo) && vistos.add(el.dataset.titulo))
    .map((el) => ({
      titulo: el.dataset.titulo!,
      id: el.id,
      fundamental: el.hasAttribute('data-fundamental'),
      hecho: hecho(ruta, el.dataset.titulo!),
    }));
}

const barra = (pct: number) =>
  `<span class="pcp-barra progreso__barra"><span class="pcp-barra__fill" style="width:${pct}%"></span></span>`;

async function init(el: HTMLElement): Promise<void> {
  const base = el.dataset.base || '';
  const grupos = JSON.parse(el.dataset.grupos || '[]') as Grupo[];
  const lista = el.querySelector<HTMLElement>('[data-lista]')!;
  const total = el.querySelector<HTMLElement>('[data-total]')!;

  const temas = grupos.flatMap((g) => g.temas.filter((t) => t.ejercicios !== false).map((t) => ({ ...t, grupo: g.grupo })));
  const datos = await Promise.all(temas.map((t) => ejerciciosDe(base + t.link).catch(() => [] as Ejercicio[])));

  let html = '';
  let grupoActual = '';
  temas.forEach((t, i) => {
    const ejs = datos[i];
    if (!ejs.length) return;
    if (t.grupo !== grupoActual) {
      if (grupoActual) html += '</div>';
      html += `<p class="progreso__grupo">${esc(t.grupo)}</p><div class="progreso__temas">`;
      grupoActual = t.grupo;
    }
    const n = ejs.filter((e) => e.hecho).length;
    const pct = Math.round((n / ejs.length) * 100);
    const estado = n === ejs.length ? 'completo' : n ? 'empezado' : 'nuevo';
    html += `
      <details class="progreso__tema progreso__tema--${estado}">
        <summary>
          <span class="progreso__nombre">${n === ejs.length ? '✅' : n ? '📝' : '⚪'} ${esc(t.titulo)}</span>
          ${barra(pct)}
          <span class="progreso__cuenta">${n}/${ejs.length}</span>
        </summary>
        <ul class="progreso__ejercicios">
          ${ejs
            .map(
              (e) => `<li class="${e.hecho ? 'es-hecho' : ''}">
                <a href="${base + t.link}#${encodeURIComponent(e.id)}">${e.hecho ? '✓' : '○'} ${esc(e.titulo)}</a>
                ${e.fundamental ? '<span class="ejercicio__fundamental">⭐</span>' : ''}
              </li>`,
            )
            .join('')}
        </ul>
        <a class="progreso__ir" href="${base + t.link}">Ir a la clase →</a>
      </details>`;
  });
  if (grupoActual) html += '</div>';
  lista.innerHTML = html;

  // Totales y "seguí por acá": el primer ejercicio sin hacer, en el orden del curso.
  const todos = datos.flat();
  const hechos = todos.filter((e) => e.hecho).length;
  const fund = todos.filter((e) => e.fundamental);
  const fundHechos = fund.filter((e) => e.hecho).length;
  const pct = todos.length ? Math.round((hechos / todos.length) * 100) : 0;
  const iSig = temas.findIndex((_, i) => datos[i].some((e) => !e.hecho));
  const sig = iSig >= 0 ? { tema: temas[iSig], ej: datos[iSig].find((e) => !e.hecho)! } : null;

  total.innerHTML = `
    <p class="progreso__titulo">${hechos === todos.length && todos.length ? '🎉' : '📈'} Llevás <b>${hechos} de ${todos.length}</b> ejercicios (${pct}%)</p>
    ${barra(pct)}
    <p class="progreso__fund">⭐ Fundamentales: <b>${fundHechos} de ${fund.length}</b></p>
    ${
      sig
        ? `<a class="progreso__seguir" href="${base + sig.tema.link}#${encodeURIComponent(sig.ej.id)}">
             👉 Seguí por acá: <b>${esc(sig.tema.titulo)}</b> — ${esc(sig.ej.titulo)}</a>`
        : todos.length
          ? '<p>¡Hiciste todo! 🎉 Antes del examen, volvé a hacer el simulacro y repasá el machete.</p>'
          : ''
    }`;
}

document.querySelectorAll<HTMLElement>('.progreso').forEach((el) => {
  init(el).catch(() => {
    el.querySelector('[data-total]')!.innerHTML = '<p>No se pudo cargar el progreso. Probá recargar la página.</p>';
  });
});
