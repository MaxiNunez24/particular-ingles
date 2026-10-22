// Simulacro de examen (components/Simulacro.astro): corrige todo junto al
// entregar. Como en la práctica, no muestra las respuestas: dice qué tipo de
// error hay y qué repasar. Se puede corregir y volver a entregar.

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';
import { prepararItems, corregirItem, limpiarItem } from './completar';

function initSimulacro(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const btnEntregar = el.querySelector<HTMLButtonElement>('[data-entregar]');
  const btnCorregir = el.querySelector<HTMLButtonElement>('[data-corregir]');
  const btnReset = el.querySelector<HTMLButtonElement>('[data-reset]');
  if (!salida || !btnEntregar || !btnCorregir || !btnReset) return;
  pintarSello(el, estaHecho(titulo));

  const { items, soluciones, borrar } = prepararItems(el, titulo, () => {
    /* mientras responde no se corrige nada */
  });
  const controles = () =>
    Array.from(el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.completar__hueco, .completar__elegir'));

  const modoRespondiendo = (si: boolean) => {
    controles().forEach((c) => (c.disabled = !si));
    btnEntregar.hidden = !si;
    btnCorregir.hidden = si;
  };

  btnEntregar.addEventListener('click', () => {
    const vacios = items.filter((li) =>
      Array.from(li.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')).some((c) => !c.value.trim()),
    ).length;
    if (vacios && !confirm(`Te quedan ${vacios} sin responder. ¿Entregás igual?`)) return;

    let bien = 0;
    items.forEach((li, i) => {
      if (corregirItem(li, soluciones[i])) bien++;
    });
    const nota = Math.round((bien / items.length) * 100) / 10;
    const aprobado = nota >= 6;
    modoRespondiendo(false);

    salida.hidden = false;
    salida.className = `ejercicio__salida simulacro__nota ${aprobado ? 'is-ok' : 'is-error'}`;
    salida.innerHTML =
      `<strong class="simulacro__numero">${nota.toFixed(1).replace('.0', '')}/10</strong>` +
      `<span>${bien} de ${items.length} bien. ` +
      (nota === 10
        ? '¡Perfecto! 🎉 Estás para el examen.'
        : nota >= 9
          ? '¡Excelente! 🎉 Mirá las que quedaron en rojo y corregilas.'
          : aprobado
            ? '¡Aprobado! 💪 Las que están en rojo tienen una pista y el tema para repasar.'
            : 'Todavía no 😕. Cada error en rojo dice qué revisar y dónde repasarlo. Repasá y volvé a entregar.') +
      '</span>';
    if (aprobado) {
      marcarHecho(titulo);
      pintarSello(el, true);
    }
    el.querySelector('.completar__item.is-mal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Corregir: vuelve a habilitar todo sin borrar lo que estaba bien.
  btnCorregir.addEventListener('click', () => {
    modoRespondiendo(true);
    salida.hidden = true;
    el.querySelector<HTMLElement>('.completar__item.is-mal input, .completar__item.is-mal select')?.focus();
  });

  btnReset.addEventListener('click', () => {
    if (!confirm('¿Borrar todas tus respuestas y empezar de cero?')) return;
    borrar();
    items.forEach(limpiarItem);
    modoRespondiendo(true);
    salida.hidden = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  modoRespondiendo(true);
}

function boot(): void {
  document.querySelectorAll<HTMLElement>('.simulacro').forEach((el) => {
    if (el.dataset.init) return;
    el.dataset.init = '1';
    initSimulacro(el);
  });
  actualizarResumen();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
