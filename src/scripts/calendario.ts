// Calendario (components/Calendario.astro): días y meses que arrancan HOY.

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';
import { arrastreTactil } from './arrastre-tactil';

// En el orden de getDay() / getMonth() (domingo = 0, enero = 0).
const DIAS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Los pares que más se confunden: la pista manda a repasar el truco de la tabla. */
const CONFUSOS = [
  ['Tuesday', 'Thursday'],
  ['June', 'July'],
  ['March', 'May'],
];

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

/** Qué está mal, sin decir la respuesta. null = está bien. */
function pista(escrito: string, correcto: string, en: string[], es: string[], vecinos: string[]): string | null {
  const x = escrito.trim().replace(/[.]$/, '');
  if (x === correcto) return null;
  const palabra = en.length === 7 ? 'día' : 'mes';
  if (!x) return 'Falta completar este casillero.';
  if (x.toLowerCase() === correcto.toLowerCase())
    return `Va con <b>mayúscula</b>: en inglés los días y los meses se escriben siempre con mayúscula.`;
  if (es.map(sinAcentos).includes(sinAcentos(x))) return 'Lo escribiste en <b>castellano</b>: va en inglés.';
  const otro = en.find((n) => n.toLowerCase() === x.toLowerCase());
  if (otro) {
    if (CONFUSOS.some((p) => p.includes(otro) && p.includes(correcto)))
      // Sin nombrar el par: decir "Tuesday y Thursday" ya es darle la respuesta.
      return `Ojo: ese ${palabra} se confunde mucho con otro parecido. Repasá el truco de la tabla para diferenciarlos.`;
    if (vecinos.includes(otro)) return `Ese ${palabra} va al lado. Fijate el orden contando desde hoy.`;
    return `Ese es otro ${palabra}. Contá en orden desde hoy.`;
  }
  if (distancia(x.toLowerCase(), correcto.toLowerCase()) <= 2)
    return `Casi: revisá cómo se escribe «<span lang="en">${esc(x)}</span>».`;
  return `Esa no es la palabra. Mirá la tabla de los ${palabra === 'día' ? 'días' : 'meses'} de arriba.`;
}

function initCalendario(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const tipo = el.dataset.tipo as 'dias' | 'meses';
  const modo = el.dataset.modo as 'arrastrar' | 'escribir' | 'hoy';
  const relativo = el.dataset.etiquetas === 'relativo';
  const rep = el.dataset.repasar ? (JSON.parse(el.dataset.repasar) as { texto: string; href: string }) : null;
  const grilla = el.querySelector<HTMLElement>('[data-grilla]')!;
  const pozo = el.querySelector<HTMLElement>('[data-pozo]');
  const salida = el.querySelector<HTMLElement>('[data-salida]')!;
  pintarSello(el, estaHecho(titulo));

  const hoy = new Date();
  const en = tipo === 'dias' ? DIAS_EN : MESES_EN;
  const es = tipo === 'dias' ? DIAS_ES : MESES_ES;
  const n = en.length;
  const inicio = tipo === 'dias' ? hoy.getDay() : hoy.getMonth();
  const idx = (k: number) => (((inicio + k) % n) + n) % n;

  el.querySelector<HTMLElement>('[data-hoy]')!.innerHTML =
    `📌 Hoy es <b>${DIAS_ES[hoy.getDay()]} ${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]}</b>.` +
    (modo !== 'hoy' ? ` Por eso el calendario empieza ${tipo === 'dias' ? 'hoy' : 'este mes'}: mañana va a arrancar en otro lado 😉` : '');

  // ---------- Los casilleros ----------
  type Casillero = { correcto: string; vecinos: string[]; etiqueta: string; frase?: string; es?: string };
  let casilleros: Casillero[];
  if (modo === 'hoy') {
    const preguntas: [number | null, string, string, string?][] =
      tipo === 'dias'
        ? [
            [0, 'Today is ___.', 'Hoy es…'],
            [1, 'Tomorrow is ___.', 'Mañana es…'],
            [-1, 'Yesterday was ___.', 'Ayer fue…'],
            [2, 'The day after tomorrow is ___.', 'Pasado mañana es…'],
            [-2, 'The day before yesterday was ___.', 'Anteayer fue…'],
            [null, 'There is no school on Saturday and ___.', 'No hay escuela el sábado y el…', 'Sunday'],
          ]
        : [
            [0, 'This month is ___.', 'Este mes es…'],
            [1, 'Next month is ___.', 'El mes que viene es…'],
            [-1, 'Last month was ___.', 'El mes pasado fue…'],
            [null, 'Christmas is in ___.', 'Navidad es en…', 'December'],
            [null, 'In Argentina, the school year starts in ___.', 'En Argentina, las clases empiezan en…', 'March'],
            [null, 'Argentina\'s Independence Day is in ___.', 'El Día de la Independencia es en…', 'July'],
          ];
    casilleros = preguntas.map(([off, frase, esFrase, fijo]) => {
      const i = off === null ? en.indexOf(fijo!) : idx(off);
      return { correcto: en[i], vecinos: [en[(i + 1) % n], en[(i + n - 1) % n]], etiqueta: '', frase, es: esFrase };
    });
  } else {
    casilleros = Array.from({ length: n }, (_, k) => {
      const i = idx(k);
      let etiqueta = es[i];
      if (relativo) {
        etiqueta =
          tipo === 'dias'
            ? ['Hoy', 'Mañana', 'Pasado mañana'][k] || `En ${k} días`
            : ['Este mes', 'El mes que viene'][k] || `En ${k} meses`;
        if (k === 0) etiqueta += ` (${es[i]})`;
      } else if (k === 0) etiqueta = `${tipo === 'dias' ? 'hoy' : 'este mes'} · ${es[i]}`;
      return { correcto: en[i], vecinos: [en[(i + 1) % n], en[(i + n - 1) % n]], etiqueta };
    });
  }

  grilla.innerHTML = casilleros
    .map((c, k) =>
      modo === 'hoy'
        ? `<div class="cal__pregunta" data-k="${k}">
             <p class="cal__es">${c.es}</p>
             <p lang="en">${c.frase!.replace('___', `<input type="text" class="completar__hueco cal__input" size="11" autocomplete="off" spellcheck="false" aria-label="${c.es}">`)}
               <button type="button" class="say__btn cal__say" data-say="${c.frase!.replace('___', c.correcto)}" hidden aria-label="Escuchar">🔊</button></p>
             <div class="completar__expl" hidden></div>
           </div>`
        : `<div class="cal__slot${k === 0 ? ' cal__slot--hoy' : ''}" data-k="${k}">
             <div class="cal__etq">${c.etiqueta}</div>
             <div class="cal__cuerpo" data-destino lang="en">${
               modo === 'escribir'
                 ? `<input type="text" class="cal__input" autocomplete="off" spellcheck="false" aria-label="${c.etiqueta} en inglés">`
                 : ''
             }</div>
             <div class="cal__pista" hidden></div>
           </div>`,
    )
    .join('');

  // ---------- Arrastrar ----------
  const tarjetas = () => [...el.querySelectorAll<HTMLElement>('.cal__tarjeta')];
  let elegida: HTMLElement | null = null;
  const elegir = (t: HTMLElement | null) => {
    tarjetas().forEach((x) => x.classList.remove('is-elegida'));
    el.classList.toggle('tiene-elegida', !!t);
    elegida = t;
    t?.classList.add('is-elegida');
  };
  const limpiar = () => {
    el.querySelectorAll('.is-bien, .is-mal').forEach((x) => x.classList.remove('is-bien', 'is-mal'));
    el.querySelectorAll<HTMLElement>('.cal__pista, .completar__expl').forEach((x) => (x.hidden = true));
    el.querySelectorAll<HTMLElement>('.cal__say').forEach((x) => (x.hidden = true));
    salida.hidden = true;
  };
  /** Pone la tarjeta en un casillero; si ya había otra, esa vuelve al pozo. */
  const poner = (t: HTMLElement, cuerpo: HTMLElement) => {
    const ocupada = cuerpo.querySelector<HTMLElement>('.cal__tarjeta');
    if (ocupada && ocupada !== t) pozo!.appendChild(ocupada);
    cuerpo.appendChild(t);
    elegir(null);
    limpiar();
  };
  const cuerpoDe = (z: Element | null) =>
    z?.closest('.cal__slot')?.querySelector<HTMLElement>('[data-destino]') ||
    (z?.closest('[data-pozo]') as HTMLElement | null);

  const armarPozo = () => {
    if (!pozo) return;
    const orden = en.map((_, i) => i).sort(() => Math.random() - 0.5);
    pozo.innerHTML = orden
      .map((i) => `<button type="button" class="clasificar__tarjeta cal__tarjeta" draggable="true" data-valor="${en[i]}">${en[i]}</button>`)
      .join('');
  };

  if (modo === 'arrastrar' && pozo) {
    armarPozo();
    el.addEventListener('click', (e) => {
      const tgt = e.target as HTMLElement;
      const t = tgt.closest<HTMLElement>('.cal__tarjeta');
      if (t) {
        elegir(elegida === t ? null : t);
        return;
      }
      if (!elegida) return;
      const cuerpo = cuerpoDe(tgt);
      if (cuerpo) {
        if (cuerpo === pozo) pozo.appendChild(elegida), elegir(null), limpiar();
        else poner(elegida, cuerpo);
      }
    });
    // mouse
    let arrastrada: HTMLElement | null = null;
    el.addEventListener('dragstart', (e) => {
      arrastrada = (e.target as HTMLElement).closest<HTMLElement>('.cal__tarjeta');
      if (!arrastrada) return;
      arrastrada.classList.add('is-arrastrando');
      el.classList.add('arrastrando');
      e.dataTransfer?.setData('text/plain', arrastrada.dataset.valor || '');
    });
    el.addEventListener('dragend', () => {
      arrastrada?.classList.remove('is-arrastrando');
      arrastrada = null;
      el.classList.remove('arrastrando');
      el.querySelectorAll('.is-encima').forEach((x) => x.classList.remove('is-encima'));
    });
    const zonas = () => [...el.querySelectorAll<HTMLElement>('.cal__slot'), pozo];
    zonas().forEach((z) => {
      z.addEventListener('dragover', (e) => {
        if (!arrastrada) return;
        e.preventDefault();
        z.classList.add('is-encima');
      });
      z.addEventListener('dragleave', (e) => {
        if (!z.contains(e.relatedTarget as Node)) z.classList.remove('is-encima');
      });
      z.addEventListener('drop', (e) => {
        e.preventDefault();
        z.classList.remove('is-encima');
        const cuerpo = cuerpoDe(z);
        if (arrastrada && cuerpo) cuerpo === pozo ? (pozo.appendChild(arrastrada), limpiar()) : poner(arrastrada, cuerpo);
      });
    });
    // dedo
    const zonaEn = (x: number, y: number) => {
      const z = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('.cal__slot, [data-pozo]');
      return z && el.contains(z) ? z : null;
    };
    arrastreTactil(el, {
      piezas: '.cal__tarjeta',
      fantasma: true,
      alEmpezar: () => {
        elegir(null);
        el.classList.add('arrastrando');
      },
      alMover: (_t, x, y) => {
        const z = zonaEn(x, y);
        zonas().forEach((c) => c.classList.toggle('is-encima', c === z));
      },
      alSoltar: (t, x, y) => {
        const z = zonaEn(x, y);
        el.classList.remove('arrastrando');
        zonas().forEach((c) => c.classList.remove('is-encima'));
        const cuerpo = cuerpoDe(z);
        if (cuerpo) cuerpo === pozo ? (pozo.appendChild(t), limpiar()) : poner(t, cuerpo);
      },
      alCancelar: () => {
        el.classList.remove('arrastrando');
        zonas().forEach((c) => c.classList.remove('is-encima'));
      },
    });
  }

  // Escribir: Enter salta al siguiente; escribir borra las marcas.
  const inputs = [...el.querySelectorAll<HTMLInputElement>('.cal__input')];
  inputs.forEach((inp, k) => {
    inp.addEventListener('input', limpiar);
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      (inputs[k + 1] || el.querySelector<HTMLElement>('[data-verify]'))?.focus();
    });
  });

  // ---------- Verificar ----------
  el.querySelector('[data-verify]')!.addEventListener('click', () => {
    const cajas = [...grilla.children] as HTMLElement[];
    if (modo === 'arrastrar' && pozo?.querySelector('.cal__tarjeta')) {
      salida.hidden = false;
      salida.className = 'ejercicio__salida is-warn';
      salida.textContent = `Te quedan ${pozo.querySelectorAll('.cal__tarjeta').length} tarjetas sin ubicar.`;
      return;
    }
    let bien = 0;
    cajas.forEach((caja, k) => {
      const c = casilleros[k];
      const escrito =
        modo === 'arrastrar'
          ? caja.querySelector<HTMLElement>('.cal__tarjeta')?.dataset.valor || ''
          : caja.querySelector<HTMLInputElement>('input')!.value;
      const p = pista(escrito, c.correcto, en, es, c.vecinos);
      caja.classList.toggle('is-bien', !p);
      caja.classList.toggle('is-mal', !!p);
      const donde = caja.querySelector<HTMLElement>('.cal__pista, .completar__expl')!;
      donde.innerHTML = p ? `🔎 ${p}` : '';
      donde.hidden = !p;
      caja.querySelector<HTMLElement>('.cal__say')?.toggleAttribute('hidden', !!p);
      if (!p) bien++;
    });
    salida.hidden = false;
    if (bien === cajas.length) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = `✅ ¡Todos bien! (${bien}/${cajas.length}) 🎉`;
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.innerHTML =
        `Van ${bien} de ${cajas.length}. En los que están en rojo tenés una pista.` +
        (rep ? `<br>📖 Repasá: <a href="${rep.href}">${rep.texto}</a>` : '');
    }
  });

  el.querySelector('[data-reset]')!.addEventListener('click', () => {
    inputs.forEach((i) => (i.value = ''));
    if (modo === 'arrastrar') armarPozo();
    elegir(null);
    limpiar();
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.calendario').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initCalendario(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
