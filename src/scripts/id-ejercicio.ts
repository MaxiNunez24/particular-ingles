/** Ancla estable para cada ejercicio.
 *
 * Antes cada componente hacía `'ej-' + Math.random().toString(36).slice(2, 9)`,
 * así que el id cambiaba en CADA build. Eso hacía imposible enlazar a un
 * ejercicio puntual: un `#ej-x7k2p9` guardado hoy apuntaba a otra cosa mañana.
 *
 * Con el título como base, el mismo ejercicio tiene siempre la misma ancla y se
 * puede enlazar desde el plan de puesta al día, desde Discord o desde un
 * marcador del navegador.
 */
export function idEjercicio(titulo: string): string {
  const slug = (titulo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // saca los acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return 'ej-' + (slug || 'sin-titulo');
}
