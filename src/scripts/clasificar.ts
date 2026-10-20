/**
 * Lógica del ejercicio de clasificar (ver components/Clasificar.astro).
 *
 * Dos formas de mover una tarjeta, y las dos hacen exactamente lo mismo:
 *   · tocar la tarjeta y después la caja  → funciona con dedo, con mouse y con
 *     teclado; es el camino principal
 *   · arrastrar y soltar                  → atajo para quien está con mouse
 *
 * Se corrige recién al tocar Verificar, no mientras se mueve: la idea es que el
 * alumno piense y decida, no que adivine por prueba y error hasta que se ponga
 * verde.
 */
import { estaHecho, marcarHecho, pintarSello } from './progreso';

export function conectarClasificar(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const pozo = el.querySelector<HTMLElement>('[data-pozo]');
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const porques = el.querySelector<HTMLElement>('[data-porques]');
  const destinos = [...el.querySelectorAll<HTMLElement>('[data-destino]')];
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
  let arrastrada: HTMLElement | null = null;
  el.addEventListener('dragstart', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tarjeta]');
    if (!t) return;
    arrastrada = t;
    t.classList.add('is-arrastrando');
    // Firefox no inicia el arrastre si no se setea algo en el dataTransfer.
    e.dataTransfer?.setData('text/plain', t.textContent || '');
  });
  el.addEventListener('dragend', () => {
    arrastrada?.classList.remove('is-arrastrando');
    arrastrada = null;
    el.querySelectorAll('.is-encima').forEach((x) => x.classList.remove('is-encima'));
  });
  [...destinos, pozo].forEach((zona) => {
    zona.addEventListener('dragover', (e) => {
      e.preventDefault(); // sin esto el navegador no permite soltar
      zona.classList.add('is-encima');
    });
    zona.addEventListener('dragleave', () => zona.classList.remove('is-encima'));
    zona.addEventListener('drop', (e) => {
      e.preventDefault();
      zona.classList.remove('is-encima');
      if (arrastrada) mover(arrastrada, zona);
    });
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

    // Los "porqué" se muestran SIEMPRE, no solo cuando está mal: acertar sin
    // saber por qué es la forma más rápida de olvidarlo.
    if (porques) {
      const conMotivo = tarjetas().filter((t) => t.dataset.porque);
      if (conMotivo.length) {
        porques.hidden = false;
        porques.innerHTML = conMotivo
          .map((t) => {
            const ok = t.classList.contains('is-bien');
            return `<li class="${ok ? 'es-bien' : 'es-mal'}"><strong>${t.textContent}</strong> — ${t.dataset.porque}</li>`;
          })
          .join('');
      }
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
