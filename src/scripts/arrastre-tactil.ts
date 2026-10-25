// Arrastrar con el dedo (tablet / celular).
//
// El drag & drop de HTML (draggable, dragstart, drop) anda con el mouse, pero
// con el dedo muchas tablets no lo disparan nunca: la alumna no podía arrastrar
// nada en la tablet. Esto lo hace a mano con eventos táctiles.
//
// Para no pelearse con el scroll de la página: la pieza se levanta recién
// cuando el dedo la mantiene apretada un instante (ESPERA). Si el dedo se mueve
// antes, es un scroll común y no se toca nada. Un toque corto sigue siendo un
// toque (el "tocá la tarjeta y después la caja" de siempre).

const ESPERA = 150; // ms apretando antes de levantar la pieza
const TOLERANCIA = 10; // px que se puede mover el dedo sin que cuente como scroll

export interface OpcionesArrastre {
  /** Selector de lo que se puede arrastrar (dentro de `raiz`). */
  piezas: string;
  /** Una copia de la pieza sigue al dedo (si no, se mueve la pieza misma). */
  fantasma?: boolean;
  alEmpezar?(pieza: HTMLElement): void;
  alMover(pieza: HTMLElement, x: number, y: number): void;
  alSoltar(pieza: HTMLElement, x: number, y: number): void;
  alCancelar?(pieza: HTMLElement): void;
}

export function arrastreTactil(raiz: HTMLElement, op: OpcionesArrastre): void {
  let pieza: HTMLElement | null = null;
  let arrastrando = false;
  let reloj = 0;
  let x0 = 0;
  let y0 = 0;
  let fantasma: HTMLElement | null = null;
  let dx = 0;
  let dy = 0;
  let draggableAntes: string | null = null;

  const empezar = (x: number, y: number) => {
    if (!pieza) return;
    arrastrando = true;
    try {
      navigator.vibrate?.(15); // un toquecito: "la agarraste"
    } catch {
      /* no todos dejan */
    }
    pieza.classList.add('is-arrastrando');
    if (op.fantasma) {
      const r = pieza.getBoundingClientRect();
      fantasma = pieza.cloneNode(true) as HTMLElement;
      fantasma.classList.add('arrastre-fantasma');
      Object.assign(fantasma.style, {
        position: 'fixed',
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        margin: '0',
        pointerEvents: 'none', // si no, elementFromPoint encontraría al fantasma
        zIndex: '1000',
      });
      dx = x - r.left;
      dy = y - r.top;
      document.body.appendChild(fantasma);
    }
    op.alEmpezar?.(pieza);
  };

  raiz.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      const objetivo = e.target as HTMLElement;
      const p = objetivo.closest<HTMLElement>(op.piezas);
      if (!p || !raiz.contains(p)) return;
      // Los botones de adentro (▲▼ de Ordenar) siguen siendo botones.
      const boton = objetivo.closest('button');
      if (boton && boton !== p) return;
      pieza = p;
      // Mientras el dedo está abajo, que el navegador no arranque SU arrastre
      // (en algunas tablets lo intenta con el toque largo y cancela el nuestro).
      draggableAntes = p.getAttribute('draggable');
      p.setAttribute('draggable', 'false');
      const t = e.touches[0];
      x0 = t.clientX;
      y0 = t.clientY;
      reloj = window.setTimeout(() => empezar(x0, y0), ESPERA);
    },
    { passive: true },
  );

  raiz.addEventListener(
    'touchmove',
    (e) => {
      if (!pieza) return;
      const t = e.touches[0];
      if (!arrastrando) {
        // Se movió antes de levantar la pieza: es un scroll, la soltamos.
        if (Math.hypot(t.clientX - x0, t.clientY - y0) > TOLERANCIA) terminar();
        return;
      }
      e.preventDefault(); // ahora el dedo mueve la pieza, no la página
      if (fantasma) {
        fantasma.style.left = `${t.clientX - dx}px`;
        fantasma.style.top = `${t.clientY - dy}px`;
      }
      op.alMover(pieza, t.clientX, t.clientY);
      // Cerca del borde de la pantalla, la página se corre sola: si no, no se
      // puede llevar una tarjeta a una caja que quedó fuera de la vista.
      const borde = 70;
      if (t.clientY < borde) window.scrollBy(0, -14);
      else if (t.clientY > window.innerHeight - borde) window.scrollBy(0, 14);
    },
    { passive: false },
  );

  const terminar = (e?: TouchEvent, soltar = false) => {
    clearTimeout(reloj);
    if (pieza && draggableAntes !== null) pieza.setAttribute('draggable', draggableAntes);
    if (pieza && arrastrando) {
      const t = e?.changedTouches[0];
      pieza.classList.remove('is-arrastrando');
      fantasma?.remove();
      fantasma = null;
      if (soltar && t) op.alSoltar(pieza, t.clientX, t.clientY);
      else op.alCancelar?.(pieza);
      // Al levantar el dedo el navegador manda un "click": si lo dejáramos
      // pasar, la tarjeta recién soltada quedaría además "elegida".
      const tragar = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      raiz.addEventListener('click', tragar, { capture: true, once: true });
      setTimeout(() => raiz.removeEventListener('click', tragar, { capture: true }), 400);
    }
    pieza = null;
    arrastrando = false;
    draggableAntes = null;
  };

  raiz.addEventListener('touchend', (e) => terminar(e, true));
  raiz.addEventListener('touchcancel', (e) => terminar(e, false));
}
