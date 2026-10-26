/* 💬 Consultar con el profe: un botón en cada ejercicio que abre WhatsApp con
 * el mensaje ya armado (la duda, en qué ejercicio está con su link, y —si
 * quiere— lo que respondió hasta ahora, para que el profe vea dónde se trabó).
 *
 * Antes de mandar se abre una ventanita para escribir la duda. Es una propia y
 * no el prompt() del navegador porque ese es un renglón chiquito que en la
 * tablet casi no se ve.
 *
 * Vanilla JS servido desde /public e incluido en todas las páginas desde
 * astro.config.mjs (head). Corre después de que la página cargó (defer).
 */
(function () {
  var WHATSAPP = '5492215251912'; // el número del profe, con código de país y sin el +
  var EJERCICIOS = '.ejercicio:not(.probador), .quiz, .ordenar';

  function txt(el) {
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  /** Lo que respondió en el ejercicio, en texto plano (según el tipo). */
  function respuestas(ej) {
    var lineas = [];
    var i;
    // Completar y simulacro: la frase con lo que escribió o eligió en cada hueco.
    ej.querySelectorAll('.completar__item').forEach(function (li, n) {
      var partes = [];
      li.querySelector('.completar__frase').childNodes.forEach(function (nodo) {
        if (nodo.tagName === 'INPUT') partes.push('[' + (nodo.value.trim() || '   ') + ']');
        else if (nodo.tagName === 'SELECT') partes.push('[' + (nodo.value === '' ? '   ' : nodo.options[nodo.selectedIndex].text) + ']');
        else partes.push(txt(nodo));
      });
      lineas.push(n + 1 + '. ' + partes.join(' ').replace(/\s+/g, ' ').trim());
    });
    // Traducir y redacción: la consigna y lo que escribió.
    ej.querySelectorAll('.traducir__item, .redaccion__parte').forEach(function (li, n) {
      var campo = li.querySelector('input, textarea');
      lineas.push(n + 1 + '. ' + txt(li.querySelector('.traducir__es, .redaccion__es')) + ' → ' + (campo.value.trim() || '(vacío)'));
    });
    // Armar la frase: lo que armó.
    ej.querySelectorAll('.armar__item').forEach(function (li, n) {
      var fichas = [];
      li.querySelectorAll('[data-respuesta] .armar__ficha').forEach(function (f) { fichas.push(txt(f)); });
      lineas.push(n + 1 + '. ' + (fichas.join(' ') || '(sin armar)'));
    });
    // Clasificar: qué puso en cada caja.
    ej.querySelectorAll('.clasificar__caja').forEach(function (caja) {
      var t = [];
      caja.querySelectorAll('[data-tarjeta]').forEach(function (f) { t.push(txt(f)); });
      lineas.push(txt(caja.querySelector('.clasificar__caja-tit')) + ': ' + (t.join(', ') || '(vacía)'));
    });
    // Ordenar: el orden en que lo dejó.
    ej.querySelectorAll('.ordenar__paso').forEach(function (p, n) { lineas.push(n + 1 + '. ' + txt(p.querySelector('.ordenar__texto'))); });
    // Calendario: cada casillero.
    ej.querySelectorAll('.cal__slot').forEach(function (s) {
      var c = s.querySelector('input');
      var v = c ? c.value.trim() : txt(s.querySelector('.cal__tarjeta'));
      lineas.push(txt(s.querySelector('.cal__etq')) + ': ' + (v || '(vacío)'));
    });
    ej.querySelectorAll('.cal__pregunta').forEach(function (p) {
      lineas.push(txt(p.querySelector('.cal__es')) + ' → ' + (p.querySelector('input').value.trim() || '(vacío)'));
    });
    // Opción múltiple: lo que eligió.
    var elegidas = ej.querySelectorAll('.quiz__opcion.is-sel');
    for (i = 0; i < elegidas.length; i++) lineas.push('Elegí: ' + txt(elegidas[i]));
    // Reloj: qué hora mostraba.
    var reloj = ej.querySelector('[data-digital]');
    if (reloj && ej.classList.contains('reloj--practica')) lineas.push('El reloj marcaba ' + txt(reloj));

    var todo = lineas.join('\n');
    return todo.length > 1200 ? todo.slice(0, 1200) + '…' : todo;
  }

  // ---------- La ventanita ----------
  var dialogo = null;
  var actual = null;

  function armarDialogo() {
    dialogo = document.createElement('dialog');
    dialogo.className = 'consultar';
    dialogo.innerHTML =
      '<form method="dialog">' +
      '<h2>💬 Consultar con el profe</h2>' +
      '<p class="consultar__ej" data-ej></p>' +
      '<p>Escribí tu duda o lo que no te sale. Se abre WhatsApp con el mensaje listo para mandar.</p>' +
      '<textarea data-duda placeholder="Por ejemplo: no entiendo por qué en la 3 va does y no do…"></textarea>' +
      '<p class="consultar__aviso" data-aviso hidden>Escribí tu duda antes de mandarla 🙂</p>' +
      '<label><input type="checkbox" data-incluir checked> Mandar también lo que respondí en este ejercicio</label>' +
      '<div class="consultar__botones">' +
      '<button type="submit" class="ejercicio__btn" value="cancelar">Cancelar</button>' +
      '<button type="button" class="ejercicio__btn consultar__enviar" data-enviar>Enviar por WhatsApp</button>' +
      '</div></form>';
    document.body.appendChild(dialogo);

    dialogo.querySelector('[data-duda]').addEventListener('input', function () {
      dialogo.querySelector('[data-aviso]').hidden = true;
    });
    dialogo.querySelector('[data-enviar]').addEventListener('click', function () {
      var duda = dialogo.querySelector('[data-duda]').value.trim();
      if (!duda) {
        dialogo.querySelector('[data-aviso]').hidden = false;
        dialogo.querySelector('[data-duda]').focus();
        return;
      }
      var ej = actual;
      var titulo = ej.dataset.titulo || txt(ej.querySelector('.ejercicio__titulo'));
      var tema = txt(document.querySelector('main h1'));
      var link = location.origin + location.pathname + (ej.id ? '#' + ej.id : '');
      var texto = 'Hola profe!\n\n' + duda + '\n\nEstoy en el ejercicio "' + titulo + '" (' + tema + '):\n' + link;
      if (dialogo.querySelector('[data-incluir]').checked) {
        var r = respuestas(ej);
        if (r) texto += '\n\nLo que puse:\n' + r;
      }
      texto += '\n\n___';
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      dialogo.close();
    });
  }

  function abrir(ej) {
    if (!dialogo) armarDialogo();
    actual = ej;
    dialogo.querySelector('[data-ej]').textContent =
      'Ejercicio: ' + (ej.dataset.titulo || txt(ej.querySelector('.ejercicio__titulo')));
    dialogo.querySelector('[data-aviso]').hidden = true;
    dialogo.showModal();
    dialogo.querySelector('[data-duda]').focus();
  }

  // ---------- Un botón por ejercicio ----------
  function agregarBotones() {
    document.querySelectorAll(EJERCICIOS).forEach(function (ej) {
      if (ej.querySelector('.consultar__btn')) return;
      var acciones = ej.querySelector('.ejercicio__acciones');
      if (!acciones) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ejercicio__btn consultar__btn';
      b.textContent = '💬 Consultar con el profe';
      b.title = 'Mandale tu duda al profe por WhatsApp';
      b.addEventListener('click', function () { abrir(ej); });
      acciones.appendChild(b);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', agregarBotones);
  else agregarBotones();
})();
