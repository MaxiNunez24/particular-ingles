// Simulacro de examen (components/Simulacro.astro): corrige todo junto al
// entregar, con la respuesta correcta y la explicación de cada error.

import { estaHecho, marcarHecho, pintarSello, actualizarResumen } from './progreso';
import { prepararItems, corregirItem, limpiarItem } from './completar';

function initSimulacro(el: HTMLElement): void {
  const titulo = el.dataset.titulo || '';
  const salida = el.querySelector<HTMLElement>('[data-salida]');
  const btnEntregar = el.querySelector<HTMLButtonElement>('[data-entregar]');
  const btnReset = el.querySelector<HTMLButtonElement>('[data-reset]');
  if (!salida || !btnEntregar || !btnReset) return;
  pintarSello(el, estaHecho(titulo));

  let entregado = false;
  const { items, soluciones, borrar } = prepararItems(el, titulo, () => {
    /* mientras responde no se corrige nada */
  });
  const controles = () =>
    Array.from(el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.completar__hueco, .completar__elegir'));

  btnEntregar.addEventListener('click', () => {
    const vacios = items.filter((li) =>
      Array.from(li.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')).some((c) => !c.value.trim()),
    ).length;
    if (vacios && !confirm(`Te quedan ${vacios} sin responder. ¿Entregás igual?`)) return;

    let bien = 0;
    items.forEach((li, i) => {
      if (corregirItem(li, soluciones[i], true)) bien++;
    });
    const nota = Math.round((bien / items.length) * 100) / 10;
    const aprobado = nota >= 6;
    entregado = true;
    controles().forEach((c) => (c.disabled = true));
    btnEntregar.hidden = true;
    btnReset.hidden = false;

    salida.hidden = false;
    salida.className = `ejercicio__salida simulacro__nota ${aprobado ? 'is-ok' : 'is-error'}`;
    salida.innerHTML =
      `<strong class="simulacro__numero">${nota.toFixed(1).replace('.0', '')}/10</strong>` +
      `<span>${bien} de ${items.length} bien. ` +
      (nota >= 9
        ? '¡Excelente! 🎉 Estás para el examen.'
        : aprobado
          ? '¡Aprobado! 💪 Mirá las que están en rojo: cada una tiene la explicación.'
          : 'Todavía no 😕. Leé las correcciones en rojo, repasá esos temas y volvé a intentar.') +
      '</span>';
    if (aprobado) {
      marcarHecho(titulo);
      pintarSello(el, true);
    }
    el.querySelector('.is-mal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  btnReset.addEventListener('click', () => {
    if (!entregado) return;
    borrar();
    items.forEach(limpiarItem);
    controles().forEach((c) => (c.disabled = false));
    entregado = false;
    btnEntregar.hidden = false;
    btnReset.hidden = true;
    salida.hidden = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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
