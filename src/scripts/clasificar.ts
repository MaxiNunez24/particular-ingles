/**
 * Lógica del ejercicio de clasificar (ver components/Clasificar.astro).
 *
 * Dos formas de mover una tarjeta, y las dos hacen exactamente lo mismo:
 *   · tocar la tarjeta y después la caja  → funciona con dedo, con mouse y con
 *     teclado; es el camino principal
 *   · arrastrar y soltar                  → con el mouse (drag & drop de HTML)
 *                                           o con el dedo (arrastre-tactil.ts)
 *
 * Se corrige recién al tocar Verificar, no mientras se mueve: la idea es que el
 * alumno piense y decida, no que adivine por prueba y error hasta que se ponga
 * verde.
 */
import { estaHecho, marcarHecho, pintarSello } from './progreso';
import { arrastreTactil } from './arrastre-tactil';

export function conectarClasificar(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const pozo = el.querySelector<HTMLElement>('[data-pozo]');
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const porques = el.querySelector<HTMLElement>('[data-porques]');
  const tarjetas = () => [...el.querySelectorAll<HTMLElement>('[data-tarjeta]')];
  if (!pozo || !salida) return;

  pintarSello(el, estaHecho(titulo));

  let elegida: HTMLElement | null = null;

  const limpiarMarcas = () => {
    tarjetas().forEach((t) => t.classList.remove('is-bien', 'is-mal'));
    salida.hidden = true;
    if (porques) {
      porques.hidden = true;
      porques.innerHTML = '';
    }
  };

  const elegir = (t: HTMLElement | null) => {
    tarjetas().forEach((x) => x.classList.remove('is-elegida'));
    el.classList.toggle('tiene-elegida', !!t);
    elegida = t;
    if (t) t.classList.add('is-elegida');
  };

  const mover = (t: HTMLElement, destino: HTMLElement) => {
    destino.appendChild(t);
    elegir(null);
    limpiarMarcas();
  };

  // --- tocar tarjeta, tocar caja ---
  el.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tarjeta]');
    if (t) {
      elegir(elegida === t ? null : t);
      return;
    }
    const caja = (e.target as HTMLElement).closest<HTMLElement>('.clasificar__caja');
    if (caja && elegida) {
      const destino = caja.querySelector<HTMLElement>('[data-destino]');
      if (destino) mover(elegida, destino);
      return;
    }
    // Tocar el pozo devuelve la tarjeta elegida a "sin clasificar".
    if ((e.target as HTMLElement).closest('[data-pozo]') && elegida) mover(elegida, pozo);
  });

  // --- arrastrar (atajo con mouse) ---
  // La zona para soltar es la caja ENTERA (título incluido), no solo su parte
  // de abajo: antes había que apuntarle a un hueco chico y no se notaba dónde.
  let arrastrada: HTMLElement | null = null;
  const cajas = [...el.querySelectorAll<HTMLElement>('.clasificar__caja')];
  const destinoDe = (zona: HTMLElement) =>
    zona === pozo ? pozo : zona.querySelector<HTMLElement>('[data-destino]');
  el.addEventListener('dragstart', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tarjeta]');
    if (!t) return;
    arrastrada = t;
    t.classList.add('is-arrastrando');
    el.classList.add('arrastrando');
    // Firefox no inicia el arrastre si no se setea algo en el dataTransfer.
    e.dataTransfer?.setData('text/plain', t.textContent || '');
  });
  el.addEventListener('dragend', () => {
    arrastrada?.classList.remove('is-arrastrando');
    arrastrada = null;
    el.classList.remove('arrastrando');
    el.querySelectorAll('.is-encima').forEach((x) => x.classList.remove('is-encima'));
  });
  [...cajas, pozo].forEach((zona) => {
    zona.addEventListener('dragover', (e) => {
      if (!arrastrada) return;
      e.preventDefault(); // sin esto el navegador no permite soltar
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      zona.classList.add('is-encima');
    });
    zona.addEventListener('dragleave', (e) => {
      // dragleave también salta al pasar sobre un hijo: solo apagamos si de
      // verdad salió de la zona.
      if (!zona.contains(e.relatedTarget as Node)) zona.classList.remove('is-encima');
    });
    zona.addEventListener('drop', (e) => {
      e.preventDefault();
      zona.classList.remove('is-encima');
      const destino = destinoDe(zona);
      if (arrastrada && destino) mover(arrastrada, destino);
    });
  });

  // --- arrastrar con el dedo (tablet) ---
  const zonaEn = (x: number, y: number) => {
    const z = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(
      '.clasificar__caja, [data-pozo]',
    );
    return z && el.contains(z) ? z : null;
  };
  const apagarZonas = () => {
    el.classList.remove('arrastrando');
    [...cajas, pozo].forEach((z) => z.classList.remove('is-encima'));
  };
  arrastreTactil(el, {
    piezas: '[data-tarjeta]',
    fantasma: true,
    alEmpezar: () => {
      elegir(null);
      el.classList.add('arrastrando');
    },
    alMover: (_t, x, y) => {
      const z = zonaEn(x, y);
      [...cajas, pozo].forEach((c) => c.classList.toggle('is-encima', c === z));
    },
    alSoltar: (t, x, y) => {
      const z = zonaEn(x, y);
      apagarZonas();
      const destino = z && destinoDe(z);
      if (destino) mover(t, destino);
    },
    alCancelar: apagarZonas,
  });

  // --- verificar ---
  el.querySelector<HTMLButtonElement>('[data-verify]')?.addEventListener('click', () => {
    const sinClasificar = pozo.querySelectorAll('[data-tarjeta]').length;
    if (sinClasificar) {
      salida.hidden = false;
      salida.className = 'ejercicio__salida is-warn';
      salida.textContent =
        sinClasificar === 1
          ? 'Te queda 1 tarjeta sin ubicar.'
          : `Te quedan ${sinClasificar} tarjetas sin ubicar.`;
      return;
    }

    let bien = 0;
    const total = tarjetas().length;
    tarjetas().forEach((t) => {
      const destino = t.closest<HTMLElement>('[data-destino]');
      const ok = destino?.dataset.destino === t.dataset.caja;
      t.classList.toggle('is-bien', !!ok);
      t.classList.toggle('is-mal', !ok);
      if (ok) bien++;
    });

    // El "porqué" se muestra solo en las que están BIEN (refuerza lo que acertó).
    // En las que están mal va una pista que no dice adónde va: si dijera "esto
    // es she → is", la alumna movería la tarjeta sin pensar.
    if (porques) {
      const lineas = tarjetas()
        .map((t) => {
          const ok = t.classList.contains('is-bien');
          if (ok && t.dataset.porque)
            return `<li class="es-bien"><strong>${t.textContent}</strong> — ${t.dataset.porque}</li>`;
          if (!ok)
            return `<li class="es-mal"><strong>${t.textContent}</strong> — ${
              t.dataset.pista || el.dataset.pistaMal || 'No va en esa caja. Volvé a leer qué agrupa cada una.'
            }</li>`;
          return '';
        })
        .filter(Boolean);
      if (el.dataset.repasar && lineas.some((l) => l.includes('es-mal'))) {
        const r = JSON.parse(el.dataset.repasar) as { texto: string; href: string };
        lineas.push(`<li class="es-repasar">📖 Repasá: <a href="${r.href}">${r.texto}</a></li>`);
      }
      porques.hidden = lineas.length === 0;
      porques.innerHTML = lineas.join('');
    }

    salida.hidden = false;
    if (bien === total) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = `✅ ¡Todas bien! (${bien}/${total}) 🎉`;
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-err';
      salida.textContent = `Van ${bien} de ${total}. Las de borde rojo están en la caja equivocada.`;
    }
  });

  // --- volver a empezar ---
  el.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => {
    tarjetas().forEach((t) => pozo.appendChild(t));
    elegir(null);
    limpiarMarcas();
  });
}
