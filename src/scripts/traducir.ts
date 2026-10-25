// Traducir (components/Traducir.astro): castellano → inglés, con banco de
// palabras opcional. Se acepta cualquiera de las traducciones listadas; si no
// coincide, se diagnostica contra la más parecida (scripts/diagnostico.ts) y
// además se buscan los errores típicos de texto libre (scripts/revisar-texto.ts).

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
import { revisarTexto } from './revisar-texto';

const NUMEROS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** Para comparar traducciones: además de lo de normalizar(), las cosas que
 *  valen igual y no tiene sentido listar (7 = 7.00 = seven, mum = mom). */
export function normalizarLibre(s: string): string {
  let t = ' ' + s.toLowerCase().replace(/[’‘]/g, "'") + ' ';
  t = t.replace(/(\d{1,2})[.:]00\b/g, '$1').replace(/\s+o'clock\b/g, ' ');
  NUMEROS.forEach((n, i) => (t = t.replace(new RegExp(`\\b${n}\\b`, 'g'), String(i))));
  t = t.replace(/\b(mom|mother|mummy|mommy)\b/g, 'mum').replace(/\b(father|daddy)\b/g, 'dad');
  return normalizar(t);
}

function b64(s: string): unknown {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))));
}

function initTraducir(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]')!;
  const soluciones = b64(el.dataset.solucion || '') as string[][];
  const items = Array.from(el.querySelectorAll<HTMLElement>('.traducir__item'));
  const inputs = items.map((li) => li.querySelector<HTMLInputElement>('.traducir__en')!);
  const rep = el.dataset.repasar ? (JSON.parse(el.dataset.repasar) as { texto: string; href: string }) : null;
  pintarSello(el, estaHecho(titulo));

  // Banco de palabras: se muestra u oculta para todo el ejercicio.
  const toggle = el.querySelector<HTMLInputElement>('[data-banco]')!;
  const pintarBanco = () => el.classList.toggle('sin-banco', !toggle.checked);
  toggle.addEventListener('change', pintarBanco);
  pintarBanco();

  const guardar = () => guardarCodigo(titulo, JSON.stringify(inputs.map((i) => i.value)));
  try {
    const g = JSON.parse(leerCodigo(titulo) || '[]') as string[];
    inputs.forEach((inp, k) => (inp.value = g[k] || ''));
  } catch {
    /* nada */
  }

  const limpiar = (li: HTMLElement) => {
    li.classList.remove('is-bien', 'is-mal');
    li.querySelector<HTMLElement>('.completar__expl')!.hidden = true;
    li.querySelector<HTMLElement>('.traducir__say')!.hidden = true;
    salida.hidden = true;
  };

  items.forEach((li, i) => {
    const inp = inputs[i];
    inp.addEventListener('input', () => {
      limpiar(li);
      guardar();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      (inputs[i + 1] || el.querySelector<HTMLElement>('[data-verify]'))?.focus();
    });
    li.querySelector('[data-fichas]')!.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!b) return;
      if (b.hasAttribute('data-borrar-palabra')) inp.value = inp.value.trim().split(/\s+/).slice(0, -1).join(' ');
      else inp.value = (inp.value.trim() + ' ' + b.textContent).trim();
      limpiar(li);
      guardar();
    });
  });

  const corregir = (li: HTMLElement, i: number): boolean => {
    const valor = inputs[i].value;
    const ok = valor.trim() !== '' && soluciones[i].some((s) => normalizarLibre(s) === normalizarLibre(valor));
    li.classList.toggle('is-bien', ok);
    li.classList.toggle('is-mal', !ok);
    li.querySelector<HTMLElement>('.traducir__say')!.hidden = !ok;
    const expl = li.querySelector<HTMLElement>('.completar__expl')!;
    if (ok) {
      expl.hidden = true;
      return true;
    }
    let msgs: string[];
    if (!valor.trim()) msgs = ['Falta escribir esta frase.'];
    else {
      // Primero los errores típicos (no dependen de qué traducción eligió);
      // si no aparece ninguno, la comparación contra la más parecida.
      msgs = revisarTexto(valor);
      if (!msgs.length) msgs = diagnosticar(normalizarLibre(valor), soluciones[i].map(normalizarLibre)) || [];
      if (!msgs.length) msgs = ['Todavía no es la frase. Volvé a leer el castellano palabra por palabra.'];
    }
    const partes = [...new Set(msgs)].map((m) => `🔎 ${m}`);
    if (rep) partes.push(`📖 Repasá: <a href="${rep.href}">${rep.texto}</a>`);
    expl.innerHTML = partes.map((p) => `<p>${p}</p>`).join('');
    expl.hidden = false;
    return false;
  };

  el.querySelector('[data-verify]')!.addEventListener('click', () => {
    if (inputs.every((i) => !i.value.trim())) {
      salida.hidden = false;
      salida.className = 'ejercicio__salida is-error';
      salida.textContent = 'Escribí al menos una frase antes de verificar 🙂';
      return;
    }
    const bien = items.filter((li, i) => corregir(li, i)).length;
    salida.hidden = false;
    if (bien === items.length) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent =
        `✅ ¡Todas bien! (${bien}/${items.length}) 🎉` +
        (toggle.checked ? ' Ahora probá sacar el banco de palabras y hacerlo de nuevo sin ayuda 💪' : ' ¡Y sin el banco de palabras! 💪');
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.textContent = `Van ${bien} de ${items.length}. Debajo de cada frase en rojo tenés una pista.`;
    }
  });

  el.querySelector('[data-reset]')!.addEventListener('click', () => {
    inputs.forEach((i) => (i.value = ''));
    items.forEach(limpiar);
    borrarCodigo(titulo);
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.traducir').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initTraducir(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
