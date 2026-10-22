// Ejercicios de completar (components/Completar.astro) y el simulacro
// (components/Simulacro.astro). Los dos usan la misma corrección; cambia cuándo
// se corrige: la práctica, cada vez que se toca Verificar; el simulacro, una
// sola vez al entregar.
//
// La respuesta correcta NO se muestra de entrada. Cuando algo está mal se dice
// qué tipo de error es (scripts/diagnostico.ts) y qué parte del tema repasar.
// Recién después de varios intentos aparece el botón para ver las respuestas.

import {
  estaHecho,
  marcarHecho,
  pintarSello,
  guardarCodigo,
  leerCodigo,
  borrarCodigo,
  actualizarResumen,
} from './progreso';
import { diagnosticar, normalizar } from './diagnostico';

export { normalizar };

type Solucion = (string[] | number)[];
interface Repasar {
  texto: string;
  href: string;
}

/** Intentos fallidos antes de ofrecer las respuestas. */
export const INTENTOS_PARA_VER = 4;

function b64(s: string): unknown {
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const controles = (li: Element) =>
  Array.from(li.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.completar__hueco, .completar__elegir'));

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

function respuestaCorrecta(c: HTMLInputElement | HTMLSelectElement, sol: string[] | number): string {
  if (typeof sol === 'number') return (c as HTMLSelectElement).options[sol + 1]?.text || '';
  return sol[0];
}

/** Qué está mal en un control, o null si está bien. */
function diagnosticoDe(c: HTMLInputElement | HTMLSelectElement, s: string[] | number): string[] | null {
  if (typeof s === 'number') {
    if (c.value === String(s)) return null;
    if (c.value === '') return ['Falta elegir una opción.'];
    const sel = c as HTMLSelectElement;
    const elegida = sel.options[Number(c.value) + 1]?.text || '';
    const correcta = sel.options[s + 1]?.text || '';
    // Las opciones son frases o palabras: el mismo diagnóstico que al escribir.
    // Si no encuentra nada concreto, un mensaje que no regale la respuesta.
    const d = diagnosticar(elegida, [correcta]) || [];
    const generico = d.length === 1 && /no es la (palabra|respuesta)/.test(d[0]);
    return generico || !d.length ? ['Esa opción no va. Volvé a leer la frase entera antes de elegir.'] : d;
  }
  return diagnosticar(c.value, s);
}

export type Modo = 'practica' | 'revelado';

/** Corrige un ítem (una frase). Marca cada control y devuelve si está todo bien.
 *  En modo 'revelado' muestra además la respuesta y la explicación. */
export function corregirItem(li: HTMLElement, sol: Solucion, modo: Modo = 'practica'): boolean {
  let bien = true;
  const faltan: string[] = [];
  const msgs: string[] = [];
  controles(li).forEach((c, k) => {
    const d = diagnosticoDe(c, sol[k]);
    c.classList.toggle('is-bien', !d);
    c.classList.toggle('is-mal', !!d);
    if (d) {
      bien = false;
      faltan.push(respuestaCorrecta(c, sol[k]));
      msgs.push(...d);
    }
  });
  li.classList.toggle('is-bien', bien);
  li.classList.toggle('is-mal', !bien);
  const say = li.querySelector<HTMLElement>('.completar__say');
  if (say) say.hidden = !bien && modo !== 'revelado';

  const expl = li.querySelector<HTMLElement>('.completar__expl');
  if (expl) {
    const partes: string[] = [];
    if (!bien) {
      [...new Set(msgs)].forEach((m) => partes.push(`🔎 ${m}`));
      const rep = li.dataset.rep ? (JSON.parse(li.dataset.rep) as Repasar) : null;
      if (rep) partes.push(`📖 Repasá: <a href="${rep.href}">${rep.texto}</a>`);
      if (modo === 'revelado') {
        partes.push(`✔️ Era: <b lang="en">${faltan.map(esc).join(' … ')}</b>`);
        if (li.dataset.expl) partes.push(`💡 ${li.dataset.expl}`);
      }
    }
    expl.innerHTML = partes.map((p) => `<p>${p}</p>`).join('');
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

// Los intentos se guardan con el mismo prefijo que el resto del progreso, así
// recargar la página no vuelve a esconder el botón de las respuestas.
function claveIntentos(titulo: string) {
  return `pcp:intentos:${location.pathname}::${titulo}`;
}
export function leerIntentos(titulo: string): number {
  try {
    return Number(localStorage.getItem(claveIntentos(titulo))) || 0;
  } catch {
    return 0;
  }
}
export function guardarIntentos(titulo: string, n: number): void {
  try {
    if (n) localStorage.setItem(claveIntentos(titulo), String(n));
    else localStorage.removeItem(claveIntentos(titulo));
  } catch {
    /* sin persistencia */
  }
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

  let intentos = leerIntentos(titulo);
  // Si miró las respuestas, acertar después no cuenta como resuelto.
  let vio = false;
  const mostrarBotonVer = () => {
    if (btnVer) btnVer.hidden = intentos < INTENTOS_PARA_VER;
  };
  mostrarBotonVer();

  const { items, soluciones, borrar } = prepararItems(el, titulo, (li) => {
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
      if (corregirItem(li, soluciones[i], vio ? 'revelado' : 'practica')) bien++;
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
      intentos = 0;
      guardarIntentos(titulo, 0);
    } else {
      intentos++;
      guardarIntentos(titulo, intentos);
      salida.className = 'ejercicio__salida is-error';
      const faltan = INTENTOS_PARA_VER - intentos;
      salida.textContent =
        `Van ${bien} de ${items.length}. Debajo de cada frase en rojo tenés una pista de qué revisar.` +
        (faltan > 0
          ? ''
          : '\n\nSi ya lo intentaste y no sale, podés ver las respuestas. Pero primero probá repasar el tema 😉');
      mostrarBotonVer();
    }
  });

  btnVer?.addEventListener('click', () => {
    vio = true;
    items.forEach((li, i) => corregirItem(li, soluciones[i], 'revelado'));
    salida.hidden = false;
    salida.className = 'ejercicio__salida';
    salida.textContent =
      '👀 Debajo de cada frase que estaba mal está la respuesta y el porqué. Esto no cuenta como resuelto: ' +
      'tocá "Borrar todo" y hacelo de nuevo sin mirar.';
  });

  el.querySelector('[data-reset]')?.addEventListener('click', () => {
    borrar();
    vio = false;
    salida.hidden = true;
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
