// Guardado de progreso del alumno en el navegador (localStorage). 100% estático.
// Clave estable por ejercicio = ruta de la página + título del ejercicio.

const NS = 'pcp';

function base(titulo: string): string {
  return `${location.pathname}::${titulo}`;
}
export function codeKey(titulo: string): string {
  return `${NS}:code:${base(titulo)}`;
}

/* Marca de tiempo por ejercicio.
 *
 * Sin esto, cuando el mismo ejercicio existe en dos computadoras la
 * sincronización tiene que adivinar cuál conservar, y lo que hacía era quedarse
 * con "el que llega último en el pedido", que no tiene nada que ver con cuál se
 * escribió después. Con la fecha, la regla pasa a ser la única razonable:
 * **gana la última edición**.
 *
 * Va como clave aparte (`pcp:ts:<ruta>::<título>`) y no adentro del valor, para
 * no romper lo que ya está guardado en los navegadores de los alumnos. */
function tsKey(titulo: string): string {
  return `${NS}:ts:${base(titulo)}`;
}
function marcarTiempo(titulo: string): void {
  try {
    localStorage.setItem(tsKey(titulo), new Date().toISOString());
  } catch {
    /* nada */
  }
}
function doneKey(titulo: string): string {
  return `${NS}:done:${base(titulo)}`;
}

export function estaHecho(titulo: string): boolean {
  try {
    return localStorage.getItem(doneKey(titulo)) === '1';
  } catch {
    return false;
  }
}
export function marcarHecho(titulo: string): void {
  try {
    localStorage.setItem(doneKey(titulo), '1');
  } catch {
    /* sin persistencia (modo privado): seguimos igual */
  }
  marcarTiempo(titulo);
  actualizarResumen();
  avisarCambio();
}

// El sincronizador (public/sync-progreso.js) escucha esto para subir el avance
// solo. No se lo llama directo porque ese script es vanilla y vive aparte del
// bundle; el evento es el único punto de contacto entre los dos.
function avisarCambio(): void {
  try {
    document.dispatchEvent(new CustomEvent('pcp:progreso'));
  } catch {
    /* nada */
  }
}
export function guardarCodigo(titulo: string, code: string): void {
  try {
    localStorage.setItem(codeKey(titulo), code);
  } catch {
    /* nada */
  }
  marcarTiempo(titulo);
  // Escribir código no dispara una subida (sería una por tecla), pero sí deja
  // anotado que hay algo sin subir: al cerrar la pestaña se manda.
  try {
    document.dispatchEvent(new CustomEvent('pcp:cambio'));
  } catch {
    /* nada */
  }
}
export function leerCodigo(titulo: string): string | null {
  try {
    return localStorage.getItem(codeKey(titulo));
  } catch {
    return null;
  }
}
export function borrarCodigo(titulo: string): void {
  try {
    localStorage.removeItem(codeKey(titulo));
  } catch {
    /* nada */
  }
}

// ---------- Insignia de eficiencia ----------
// Los ejercicios de lógica guardan, además del "hecho", la mejor marca lograda.
// Va con el mismo prefijo 'pcp:' que todo lo demás, así viaja en el sincronizado.

export interface MarcaEficiencia {
  pasos: number;
  nivel: string; // 'optimo' | 'bueno' | 'mejorable' | 'bruta'
  emoji: string;
}

export function leerEficiencia(titulo: string): MarcaEficiencia | null {
  try {
    const crudo = localStorage.getItem(`${NS}:efi:${base(titulo)}`);
    return crudo ? (JSON.parse(crudo) as MarcaEficiencia) : null;
  } catch {
    return null;
  }
}

// Solo pisa la marca anterior si esta es MEJOR (menos pasos). Así probar una
// idea peor no borra el récord que ya se había ganado.
export function guardarEficiencia(titulo: string, marca: MarcaEficiencia): boolean {
  const previa = leerEficiencia(titulo);
  if (previa && previa.pasos <= marca.pasos) return false;
  try {
    localStorage.setItem(`${NS}:efi:${base(titulo)}`, JSON.stringify(marca));
  } catch {
    /* nada */
  }
  return true;
}

// Marca/oculta el sello "✓ Resuelto" de un ejercicio.
export function pintarSello(el: HTMLElement, hecho: boolean): void {
  const sello = el.querySelector<HTMLElement>('.ej-hecho');
  if (sello) sello.hidden = !hecho;
  el.classList.toggle('ej-resuelto', hecho);
}

// Borra el progreso (código + hechos) de la página actual — solo de esta clase,
// nunca de todo el sitio. Devuelve cuántas claves borró.
//
// Antes borraba y listo. Un alumno perdió su avance (por una limpieza del
// navegador, no por este botón) y el susto dejó clara una cosa: un botón que
// destruye trabajo y no se puede deshacer no tiene por qué existir. Ahora lo
// borrado va a una papelera de la que se puede volver.
const PAPELERA = `${NS}:papelera:`;

function borrarProgresoPagina(): number {
  try {
    const marca = `:${location.pathname}::`;
    const aBorrar: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS + ':') && !k.startsWith(PAPELERA) && k.includes(marca)) aBorrar.push(k);
    }
    const copia: Record<string, string> = {};
    aBorrar.forEach((k) => {
      copia[k] = localStorage.getItem(k) ?? '';
      localStorage.removeItem(k);
    });
    localStorage.setItem(PAPELERA + location.pathname, JSON.stringify(copia));
    return aBorrar.length;
  } catch {
    return 0;
  }
}

function contarGuardado(): number {
  try {
    const marca = `:${location.pathname}::`;
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS + ':') && !k.startsWith(PAPELERA) && k.includes(marca)) n++;
    }
    return n;
  } catch {
    return 0;
  }
}

function hayEnPapelera(): number {
  try {
    const crudo = localStorage.getItem(PAPELERA + location.pathname);
    return crudo ? Object.keys(JSON.parse(crudo) as Record<string, string>).length : 0;
  } catch {
    return 0;
  }
}

function restaurarPapelera(): void {
  try {
    const crudo = localStorage.getItem(PAPELERA + location.pathname);
    if (!crudo) return;
    const copia = JSON.parse(crudo) as Record<string, string>;
    Object.keys(copia).forEach((k) => localStorage.setItem(k, copia[k]));
    localStorage.removeItem(PAPELERA + location.pathname);
  } catch {
    /* nada */
  }
}

// Crea/actualiza la barra de progreso arriba del contenido.
export function actualizarResumen(): void {
  // .probador queda afuera: usa el CSS de .ejercicio pero no es algo que se
  // "resuelva", así que contarlo daría un 0/1 permanente.
  const ejercicios = document.querySelectorAll<HTMLElement>(
    '.ejercicio:not(.probador), .diagrama, .quiz, .ordenar',
  );
  if (ejercicios.length === 0) return;
  const total = ejercicios.length;
  let hechos = 0;
  ejercicios.forEach((el) => {
    if (el.dataset.titulo && estaHecho(el.dataset.titulo)) hechos++;
  });

  let banner = document.getElementById('pcp-resumen');
  if (!banner) {
    const cont = document.querySelector('.sl-markdown-content') || document.body;
    banner = document.createElement('div');
    banner.id = 'pcp-resumen';
    banner.className = 'pcp-resumen';
    cont.insertBefore(banner, cont.firstChild);
  }
  const pct = Math.round((hechos / total) * 100);
  const completo = hechos === total;
  const enPapelera = hayEnPapelera();
  banner.innerHTML = `
    <div class="pcp-resumen__txt">
      <span>${completo ? '🎉 ' : '📈 '}Tu progreso: <strong>${hechos}/${total}</strong> ejercicios</span>
      ${
        enPapelera
          ? `<button type="button" class="pcp-resumen__deshacer">↶ Deshacer el borrado (${enPapelera})</button>`
          : `<button type="button" class="pcp-resumen__reset" title="Borra tus respuestas y tus marcas de ESTE tema. Se puede deshacer.">↺ Empezar este tema de nuevo</button>`
      }
    </div>
    <div class="pcp-barra"><div class="pcp-barra__fill" style="width:${pct}%"></div></div>`;

  banner
    .querySelector<HTMLButtonElement>('.pcp-resumen__reset')
    ?.addEventListener('click', () => {
      // Se cuenta lo que REALMENTE hay guardado, no los ejercicios de la
      // página: decir "19" cuando el alumno resolvió 2 asusta de más.
      const msg =
        `Vas a borrar lo que tenés guardado de ESTE tema (${contarGuardado()} cosas: respuestas y marcas).\n\n` +
        `El resto de los temas no se toca, y vas a poder deshacerlo desde esta misma barra.\n\n¿Seguimos?`;
      if (confirm(msg)) {
        borrarProgresoPagina();
        location.reload();
      }
    });

  banner
    .querySelector<HTMLButtonElement>('.pcp-resumen__deshacer')
    ?.addEventListener('click', () => {
      restaurarPapelera();
      location.reload();
    });
}
