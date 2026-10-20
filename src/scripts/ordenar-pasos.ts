// Ejercicio de ordenar pasos: mover con ▲▼, con teclado o arrastrando.
//
// Sin editor y sin Python: es el ejercicio de pensar el algoritmo antes de
// escribirlo. Por eso el feedback dice CUÁNTOS pasos están en su lugar y marca
// cuáles — pero nunca dice adónde va el que falta.

import {
  estaHecho,
  marcarHecho,
  pintarSello,
  guardarCodigo,
  leerCodigo,
  borrarCodigo,
  actualizarResumen,
} from './progreso';

function items(lista: HTMLElement): HTMLElement[] {
  return Array.from(lista.querySelectorAll<HTMLElement>('.ordenar__paso'));
}

function initOrdenar(el: HTMLElement): void {
  const lista = el.querySelector<HTMLElement>('[data-lista]');
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const btnVerify = el.querySelector<HTMLButtonElement>('[data-verify]');
  const btnReset = el.querySelector<HTMLButtonElement>('[data-reset]');
  if (!lista || !salida) return;

  const titulo = el.dataset.titulo || '';
  const total = items(lista).length;
  // El desorden original, para el botón "Volver a empezar".
  const ordenInicial = items(lista).map((li) => li.dataset.idx || '');

  pintarSello(el, estaHecho(titulo));

  const acomodar = (orden: string[]): void => {
    const porIdx = new Map(items(lista).map((li) => [li.dataset.idx || '', li]));
    orden.forEach((idx) => {
      const li = porIdx.get(idx);
      if (li) lista.appendChild(li);
    });
  };

  // El orden en el que lo dejó la última vez (viaja con "Sincronizar progreso",
  // que copia todo lo que empieza con 'pcp:').
  const guardado = leerCodigo(titulo);
  if (guardado) {
    try {
      const orden = JSON.parse(guardado) as string[];
      if (Array.isArray(orden) && orden.length === total) acomodar(orden);
    } catch {
      /* si quedó algo raro guardado, arrancamos con el desorden original */
    }
  }

  const guardarOrden = () => guardarCodigo(titulo, JSON.stringify(items(lista).map((li) => li.dataset.idx)));

  // Al mover algo, las marcas ✓ de la verificación anterior dejan de valer.
  const limpiarMarcas = () => {
    items(lista).forEach((li) => li.classList.remove('is-ok'));
    salida.hidden = true;
  };

  // ---------- Mover ----------

  lista.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.ordenar__mover');
    if (!btn) return;
    const li = btn.closest<HTMLElement>('.ordenar__paso');
    if (!li) return;
    const arriba = btn.hasAttribute('data-subir');
    const vecino = arriba ? li.previousElementSibling : li.nextElementSibling;
    if (!vecino) return;

    // Al mover con el mouse la página no se corre, pero con el teclado sí
    // podría: guardamos dónde estaba el botón y lo devolvemos a su lugar.
    const antes = btn.getBoundingClientRect().top;
    if (arriba) lista.insertBefore(li, vecino);
    else lista.insertBefore(vecino, li);
    const despues = btn.getBoundingClientRect().top;
    if (despues !== antes) window.scrollBy({ top: despues - antes, behavior: 'instant' as ScrollBehavior });

    btn.focus(); // que el foco siga al paso que se movió, no se pierda
    limpiarMarcas();
    guardarOrden();
  });

  // ---------- Arrastrar (mouse) ----------
  // El drag de HTML5 no dispara con el dedo, así que en celular manda ▲▼.

  let arrastrando: HTMLElement | null = null;

  lista.addEventListener('dragstart', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.ordenar__paso');
    if (!li) return;
    arrastrando = li;
    li.classList.add('is-drag');
    e.dataTransfer?.setData('text/plain', li.dataset.idx || '');
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });

  lista.addEventListener('dragend', () => {
    arrastrando?.classList.remove('is-drag');
    arrastrando = null;
    limpiarMarcas();
    guardarOrden();
  });

  lista.addEventListener('dragover', (e) => {
    if (!arrastrando) return;
    e.preventDefault(); // sin esto el navegador no deja soltar
    const sobre = (e.target as HTMLElement).closest<HTMLElement>('.ordenar__paso');
    if (!sobre || sobre === arrastrando) return;
    // Antes o después según de qué mitad del elemento estemos: así el hueco
    // sigue al cursor en vez de saltar cuando se toca el borde.
    const r = sobre.getBoundingClientRect();
    const despues = e.clientY > r.top + r.height / 2;
    lista.insertBefore(arrastrando, despues ? sobre.nextSibling : sobre);
  });

  // ---------- Verificar ----------

  btnVerify?.addEventListener('click', () => {
    const lis = items(lista);
    let bien = 0;
    lis.forEach((li, i) => {
      const ok = Number(li.dataset.idx) === i;
      li.classList.toggle('is-ok', ok);
      if (ok) bien++;
    });
    salida.hidden = false;
    if (bien === total) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = '✅ ¡Ese es el orden! 🎉';
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.textContent =
        `🔎 ${bien} de ${total} pasos están en su lugar (los marcados con ✓).\n\n` +
        'Leé la lista de arriba a abajo y fijate qué cosa no puede pasar antes que otra.';
    }
  });

  btnReset?.addEventListener('click', () => {
    acomodar(ordenInicial);
    limpiarMarcas();
    borrarCodigo(titulo);
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.ordenar').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initOrdenar(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
document.addEventListener('astro:page-load', boot);
