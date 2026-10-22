// Ejercicio de opción múltiple: seleccionar opción(es) y verificar contra la
// solución, con explicaciones al revelar.

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';

interface Solucion {
  correctas: number[];
  expl: Record<number, string>;
  multiple: boolean;
}

function b64decode(s: string): string {
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function initQuiz(el: HTMLElement): void {
  const sol = JSON.parse(b64decode(el.dataset.solucion || '')) as Solucion;
  const titulo = el.dataset.titulo || '';
  pintarSello(el, estaHecho(titulo));
  const correctas = new Set(sol.correctas);
  const opciones = el.querySelectorAll<HTMLButtonElement>('.quiz__opcion');
  const salida = el.querySelector<HTMLElement>('[data-q-salida]');
  const seleccion = new Set<number>();

  const setMarca = (btn: HTMLButtonElement, on: boolean) => {
    btn.classList.toggle('is-sel', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  opciones.forEach((btn) => {
    const idx = Number(btn.dataset.idx);
    btn.addEventListener('click', () => {
      if (sol.multiple) {
        // toggle
        if (seleccion.has(idx)) seleccion.delete(idx);
        else seleccion.add(idx);
        setMarca(btn, seleccion.has(idx));
      } else {
        // una sola: limpiar y elegir esta
        seleccion.clear();
        opciones.forEach((b) => setMarca(b, false));
        seleccion.add(idx);
        setMarca(btn, true);
      }
      // al cambiar la selección, borramos marcas de corrección previas
      opciones.forEach((b) => b.classList.remove('quiz-ok', 'quiz-mal', 'quiz-falta'));
      if (salida) salida.hidden = true;
    });
  });

  /* Las explicaciones se escriben con algo de HTML (<code>, <strong>) porque
     casi siempre nombran una función o una palabra clave, y en texto plano se
     leen mal. Con textContent salían las etiquetas crudas en pantalla.
     El contenido lo escribe el profe en el .mdx, no viene de nadie de afuera. */
  const mostrar = (texto: string, estado: 'is-ok' | 'is-error') => {
    if (!salida) return;
    salida.hidden = false;
    // Los saltos de línea del armado se convierten en <br> para no depender
    // del white-space del CSS.
    salida.innerHTML = texto.replace(/\n/g, '<br>');
    salida.className = 'ejercicio__salida ' + estado;
  };

  el.querySelector<HTMLButtonElement>('[data-q-verificar]')?.addEventListener('click', () => {
    if (seleccion.size === 0) {
      mostrar('Elegí una opción antes de verificar 🙂', 'is-error');
      return;
    }
    // Solo se marca lo que ELIGIÓ: si marcáramos también la correcta que le
    // faltó, la corrección le diría la respuesta.
    const explicaciones: string[] = [];
    let bien = true;
    opciones.forEach((btn) => {
      const idx = Number(btn.dataset.idx);
      const elegida = seleccion.has(idx);
      const correcta = correctas.has(idx);
      btn.classList.remove('quiz-ok', 'quiz-mal', 'quiz-falta');
      if (elegida && correcta) btn.classList.add('quiz-ok');
      else if (elegida && !correcta) btn.classList.add('quiz-mal');
      if (elegida !== correcta) bien = false;
      if (sol.expl[idx] && elegida) explicaciones.push(`${correcta ? '✅' : '🔎'} ${sol.expl[idx]}`);
    });
    if (bien) {
      mostrar('✅ ¡Correcto!' + (explicaciones.length ? '\n\n' + explicaciones.join('\n') : ''), 'is-ok');
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      const soloFalta = [...seleccion].every((i) => correctas.has(i));
      const rep = el.dataset.repasar ? (JSON.parse(el.dataset.repasar) as { texto: string; href: string }) : null;
      mostrar(
        (soloFalta ? '🔎 Lo que elegiste está bien, pero falta marcar alguna más.' : '❌ Todavía no.') +
          (explicaciones.length ? '\n\n' + explicaciones.join('\n') : '') +
          (rep ? `\n\n📖 Repasá: <a href="${rep.href}">${rep.texto}</a>` : ''),
        'is-error',
      );
    }
  });

  el.querySelector<HTMLButtonElement>('[data-q-reset]')?.addEventListener('click', () => {
    seleccion.clear();
    opciones.forEach((b) => {
      setMarca(b, false);
      b.classList.remove('quiz-ok', 'quiz-mal', 'quiz-falta');
    });
    if (salida) salida.hidden = true;
  });
}

function bootQuiz(): void {
  document.querySelectorAll<HTMLElement>('.quiz').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initQuiz(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') bootQuiz();
else document.addEventListener('DOMContentLoaded', bootQuiz);
document.addEventListener('astro:page-load', bootQuiz);
