// Armar la frase (components/ArmarFrase.astro): las fichas pasan de abajo
// (disponibles) a arriba (la frase) y vuelven con otro toque.

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';

function initArmar(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const items = Array.from(el.querySelectorAll<HTMLElement>('.armar__item'));
  if (!salida) return;
  pintarSello(el, estaHecho(titulo));

  const limpiar = (li: HTMLElement) => {
    li.classList.remove('is-bien', 'is-mal');
    const say = li.querySelector<HTMLElement>('.armar__say');
    if (say) say.hidden = true;
    salida.hidden = true;
  };

  items.forEach((li) => {
    const resp = li.querySelector<HTMLElement>('[data-respuesta]')!;
    const fichas = li.querySelector<HTMLElement>('[data-fichas]')!;
    const final = resp.querySelector('.armar__final');
    li.addEventListener('click', (e) => {
      const f = (e.target as HTMLElement).closest<HTMLElement>('.armar__ficha');
      if (!f) return;
      if (f.parentElement === fichas) resp.insertBefore(f, final);
      else fichas.appendChild(f);
      limpiar(li);
    });
  });

  const frase = (li: HTMLElement) =>
    Array.from(li.querySelectorAll('[data-respuesta] .armar__ficha'))
      .map((b) => b.textContent || '')
      .join(' ');

  el.querySelector('[data-verify]')?.addEventListener('click', () => {
    let bien = 0;
    let incompletas = 0;
    items.forEach((li) => {
      const armada = frase(li);
      if (li.querySelector('[data-fichas] .armar__ficha')) incompletas++;
      const ok = armada.toLowerCase() === (li.dataset.solucion || '').toLowerCase();
      if (!armada) return;
      li.classList.toggle('is-bien', ok);
      li.classList.toggle('is-mal', !ok);
      const say = li.querySelector<HTMLElement>('.armar__say');
      if (say) say.hidden = !ok;
      if (ok) bien++;
    });
    salida.hidden = false;
    if (bien === items.length) {
      salida.className = 'ejercicio__salida is-ok';
      salida.textContent = `✅ ¡Todas bien! (${bien}/${items.length}) 🎉 Tocá 🔊 para escucharlas.`;
      marcarHecho(titulo);
      pintarSello(el, true);
    } else {
      salida.className = 'ejercicio__salida is-error';
      salida.textContent =
        `Van ${bien} de ${items.length}.` +
        (incompletas ? ' Hay frases a las que les faltan palabras.' : '') +
        ' En las preguntas, acordate del orden: (palabra de pregunta) + do/does/is/are + sujeto + verbo.';
    }
  });

  el.querySelector('[data-reset]')?.addEventListener('click', () => {
    items.forEach((li) => {
      const fichas = li.querySelector<HTMLElement>('[data-fichas]')!;
      li.querySelectorAll('[data-respuesta] .armar__ficha').forEach((f) => fichas.appendChild(f));
      limpiar(li);
    });
  });
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.armar').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initArmar(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
