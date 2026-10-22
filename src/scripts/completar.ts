// Ejercicios de completar (components/Completar.astro) y el simulacro
// (components/Simulacro.astro). Los dos usan la misma corrección; cambia cuándo
// se corrige: la práctica, cada vez que se toca Verificar; el simulacro, una
// sola vez al entregar.
//
// La respuesta correcta NO se muestra nunca. Cuando algo está mal se dice qué
// tipo de error es (scripts/diagnostico.ts) y qué parte del tema repasar; con
// eso y el botón Verificar alcanza para resolver todo.

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

function b64(s: string): unknown {
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const controles = (li: Element) =>
  Array.from(li.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.completar__hueco, .completar__elegir'));

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

/** Corrige un ítem (una frase). Marca cada control y devuelve si está todo bien.
 *  Si está mal: pistas y qué repasar. Si está bien: el porqué, para afirmarlo. */
export function corregirItem(li: HTMLElement, sol: Solucion): boolean {
  let bien = true;
  const msgs: string[] = [];
  controles(li).forEach((c, k) => {
    const d = diagnosticoDe(c, sol[k]);
    c.classList.toggle('is-bien', !d);
    c.classList.toggle('is-mal', !!d);
    if (d) {
      bien = false;
      msgs.push(...d);
    }
  });
  li.classList.toggle('is-bien', bien);
  li.classList.toggle('is-mal', !bien);
  const say = li.querySelector<HTMLElement>('.completar__say');
  if (say) say.hidden = !bien;

  const expl = li.querySelector<HTMLElement>('.completar__expl');
  if (expl) {
    const partes: string[] = [];
    if (!bien) {
      [...new Set(msgs)].forEach((m) => partes.push(`🔎 ${m}`));
      const rep = li.dataset.rep ? (JSON.parse(li.dataset.rep) as Repasar) : null;
      if (rep) partes.push(`📖 Repasá: <a href="${rep.href}">${rep.texto}</a>`);
      li.dataset.fallo = '1';
    } else if (li.dataset.expl && li.dataset.fallo) {
      // La corrigió después de haberse equivocado: ahora sí, el porqué (nombra
      // la respuesta que ella misma escribió). En las que salieron bien de
      // entrada no se muestra, para no llenar la pantalla de texto.
      partes.push(`💡 ${li.dataset.expl}`);
    }
    expl.classList.toggle('es-bien', bien);
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
      items.forEach((li) => {
        limpiarItem(li);
        delete li.dataset.fallo;
      });
      borrarCodigo(clave);
    },
    guardar,
  };
}

function initCompletar(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  if (!salida) return;
  pintarSello(el, estaHecho(titulo));

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
      if (corregirItem(li, soluciones[i])) bien++;
    });
    salida.hidden = false;
    if (bien === items.length) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = `✅ ¡Todas bien! (${bien}/${items.length}) 🎉 Tocá 🔊 para escuchar cada frase.`;
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.textContent =
        `Van ${bien} de ${items.length}. Debajo de cada frase en rojo tenés una pista de qué revisar ` +
        'y un link a la parte del tema que te ayuda. Corregí y volvé a verificar.';
    }
  });

  el.querySelector('[data-reset]')?.addEventListener('click', () => {
    borrar();
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
