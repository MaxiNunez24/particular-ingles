// Ejercicios de completar (components/Completar.astro) y el simulacro
// (components/Simulacro.astro). Los dos usan la misma corrección; cambia cuándo
// se corrige: la práctica, cada vez que se toca Verificar; el simulacro, una
// sola vez al entregar.

import {
  estaHecho,
  marcarHecho,
  pintarSello,
  guardarCodigo,
  leerCodigo,
  borrarCodigo,
  actualizarResumen,
} from './progreso';

type Solucion = (string[] | number)[];

function b64(s: string): unknown {
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Para comparar respuestas: sin mayúsculas, sin puntuación, y con las
 *  contracciones abiertas (doesn't = does not, I'm = I am). */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?¿¡;:"]/g, ' ')
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bcannot\b/g, 'can not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am')
    .replace(/'re\b/g, ' are')
    .replace(/\b(he|she|it|what|where|who|that|there|how)'s\b/g, '$1 is')
    .replace(/\s+/g, ' ')
    .trim();
}

const controles = (li: Element) =>
  Array.from(li.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.completar__hueco, .completar__elegir'));

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

function respuestaCorrecta(c: HTMLInputElement | HTMLSelectElement, sol: string[] | number): string {
  if (typeof sol === 'number') return (c as HTMLSelectElement).options[sol + 1]?.text || '';
  return sol[0];
}

/** Corrige un ítem (una frase). Marca cada control y devuelve si está todo bien. */
export function corregirItem(li: HTMLElement, sol: Solucion, conRespuesta: boolean): boolean {
  let bien = true;
  const faltan: string[] = [];
  controles(li).forEach((c, k) => {
    const s = sol[k];
    const ok =
      typeof s === 'number'
        ? c.value === String(s)
        : s.some((a) => normalizar(a) === normalizar(c.value)) && c.value.trim() !== '';
    c.classList.toggle('is-bien', ok);
    c.classList.toggle('is-mal', !ok);
    if (!ok) {
      bien = false;
      faltan.push(respuestaCorrecta(c, s));
    }
  });
  li.classList.toggle('is-bien', bien);
  li.classList.toggle('is-mal', !bien);
  const say = li.querySelector<HTMLElement>('.completar__say');
  if (say) say.hidden = !bien && !conRespuesta;
  const expl = li.querySelector<HTMLElement>('.completar__expl');
  if (expl) {
    const texto = li.dataset.expl || '';
    const partes: string[] = [];
    if (!bien && conRespuesta) partes.push(`✔️ Era: <b lang="en">${faltan.map(esc).join(' … ')}</b>`);
    if (!bien && texto) partes.push(texto);
    expl.innerHTML = partes.join('<br>');
    expl.hidden = partes.length === 0;
  }
  return bien;
}

export function limpiarItem(li: HTMLElement): void {
  li.classList.remove('is-bien', 'is-mal');
  controles(li).forEach((c) => c.classList.remove('is-bien', 'is-mal'));
  const say = li.querySelector<HTMLElement>('.completar__say');
  if (say) say.hidden = true;
  const expl = li.querySelector<HTMLElement>('.completar__expl');
  if (expl) expl.hidden = true;
}

export function mostrarRespuestas(li: HTMLElement, sol: Solucion): void {
  controles(li).forEach((c, k) => {
    const s = sol[k];
    c.value = typeof s === 'number' ? String(s) : s[0];
  });
}

/** Prepara los ítems de un bloque: les pasa su explicación, y guarda/restaura
 *  lo escrito para que no se pierda al cerrar la pestaña. */
export function prepararItems(el: HTMLElement, clave: string, alCambiar: (li: HTMLElement) => void) {
  const expl = b64(el.dataset.expl || '') as string[];
  const items = Array.from(el.querySelectorAll<HTMLElement>('.completar__item'));
  items.forEach((li, i) => (li.dataset.expl = expl[i] || ''));

  const todos = () => items.flatMap(controles);
  const guardado = leerCodigo(clave);
  if (guardado) {
    try {
      const valores = JSON.parse(guardado) as string[];
      todos().forEach((c, k) => (c.value = valores[k] ?? ''));
    } catch {
      /* algo raro guardado: arrancamos en blanco */
    }
  }
  const guardar = () => guardarCodigo(clave, JSON.stringify(todos().map((c) => c.value)));

  items.forEach((li) => {
    controles(li).forEach((c) => {
      c.addEventListener('input', () => {
        alCambiar(li);
        guardar();
      });
      // Enter en un hueco salta al siguiente, como en una planilla.
      c.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key !== 'Enter') return;
        e.preventDefault();
        const lista = todos();
        const sig = lista[lista.indexOf(c) + 1];
        if (sig) sig.focus();
        else el.querySelector<HTMLButtonElement>('[data-verify], [data-entregar]')?.focus();
      });
    });
  });

  return {
    items,
    soluciones: b64(el.dataset.solucion || '') as Solucion[],
    borrar: () => {
      todos().forEach((c) => (c.value = ''));
      items.forEach(limpiarItem);
      borrarCodigo(clave);
    },
    guardar,
  };
}

function initCompletar(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const btnVer = el.querySelector<HTMLButtonElement>('[data-ver]');
  if (!salida) return;
  pintarSello(el, estaHecho(titulo));

  // Si miró las respuestas, acertar después no cuenta como resuelto.
  let vio = false;
  const { items, soluciones, borrar, guardar } = prepararItems(el, titulo, (li) => {
    limpiarItem(li);
    salida.hidden = true;
  });

  el.querySelector('[data-verify]')?.addEventListener('click', () => {
    const vacios = items.filter((li) => controles(li).every((c) => !c.value.trim()));
    if (vacios.length === items.length) {
      salida.hidden = false;
      salida.className = 'ejercicio__salida is-error';
      salida.textContent = 'Completá al menos una frase antes de verificar 🙂';
      return;
    }
    let bien = 0;
    items.forEach((li, i) => {
      if (corregirItem(li, soluciones[i], false)) bien++;
    });
    salida.hidden = false;
    if (bien === items.length && vio) {
      salida.className = 'ejercicio__salida';
      salida.textContent = '👀 Están bien, pero las miraste. Tocá "Borrar todo" y hacelo sin mirar para que cuente.';
    } else if (bien === items.length) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = `✅ ¡Todas bien! (${bien}/${items.length}) 🎉 Tocá 🔊 para escuchar cada frase.`;
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.textContent =
        `Van ${bien} de ${items.length}. Las marcadas en rojo tienen algo para revisar: ` +
        'leé la explicación y probá de nuevo.';
      if (btnVer) btnVer.hidden = false;
    }
  });

  btnVer?.addEventListener('click', () => {
    vio = true;
    items.forEach((li, i) => {
      mostrarRespuestas(li, soluciones[i]);
      corregirItem(li, soluciones[i], false);
    });
    guardar();
    salida.hidden = false;
    salida.className = 'ejercicio__salida';
    salida.textContent =
      '👀 Ahí están las respuestas. No cuenta como resuelto: tocá "Borrar todo" y hacelo de nuevo sin mirar.';
  });

  el.querySelector('[data-reset]')?.addEventListener('click', () => {
    borrar();
    vio = false;
    salida.hidden = true;
    if (btnVer) btnVer.hidden = true;
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.completar').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initCompletar(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
