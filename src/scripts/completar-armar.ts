// Lado servidor de los ejercicios de completar: convierte cada frase escrita en
// el .mdx en pedazos (texto, hueco para escribir, opciones para elegir).
//
// La sintaxis de una frase:
//   ___            → hueco para escribir; su respuesta sale de `r`, en orden
//   {am|*is|are}   → elegir entre opciones; la del * es la correcta
//
//   { f: 'She ___ (go) to school by bus.', r: ['goes'] }
//   { f: 'They {is|*are} watching TV.' }
//   { f: '___ she live in Rosario?', r: [['Does', 'does']] }
//
// Cada respuesta de `r` puede ser un texto o una lista de textos aceptados. Las
// contracciones se aceptan solas en las dos formas (doesn't = does not), así que
// no hace falta listarlas.

/** A qué parte del material mandar a repasar cuando algo sale mal. */
export interface Repasar {
  texto: string;
  href: string;
}

export interface ItemCompletar {
  /** La frase, con ___ y {a|*b} */
  f: string;
  /** Respuestas de los ___, en orden */
  r?: (string | string[])[];
  /** El porqué: se muestra SOLO cuando esa frase ya está bien, para afirmar
   *  lo que acertó. Puede nombrar la respuesta. */
  e?: string;
  /** Qué repasar si esta frase sale mal (si no, el del ejercicio). */
  rep?: Repasar;
}

export type Pedazo =
  | { tipo: 'texto'; html: string }
  | { tipo: 'hueco'; ancho: number }
  | { tipo: 'elegir'; opciones: string[] };

export interface ItemArmado {
  pedazos: Pedazo[];
  /** Por cada hueco/opción, en orden: textos aceptados o índice correcto. */
  solucion: (string[] | number)[];
  /** La frase completa y correcta, en texto plano (para leerla en voz alta). */
  correcta: string;
  e?: string;
  rep?: Repasar;
}

const sinEtiquetas = (s: string) => s.replace(/<[^>]+>/g, '');

export function armarItem(item: ItemCompletar): ItemArmado {
  const pedazos: Pedazo[] = [];
  const solucion: (string[] | number)[] = [];
  let correcta = '';
  let n = 0;
  let ultimo = 0;
  const re = /___|\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(item.f))) {
    const antes = item.f.slice(ultimo, m.index);
    if (antes) pedazos.push({ tipo: 'texto', html: antes });
    correcta += antes;
    if (m[0] === '___') {
      const resp = item.r?.[n++];
      if (resp === undefined) throw new Error(`Falta la respuesta del hueco ${n} en: ${item.f}`);
      const aceptadas = Array.isArray(resp) ? resp : [resp];
      const largo = Math.max(...aceptadas.map((a) => a.length));
      pedazos.push({ tipo: 'hueco', ancho: Math.max(4, largo + 2) });
      solucion.push(aceptadas);
      correcta += aceptadas[0];
    } else {
      const crudas = m[1].split('|');
      const idx = crudas.findIndex((o) => o.startsWith('*'));
      if (idx < 0) throw new Error(`Ninguna opción marcada con * en: ${item.f}`);
      const opciones = crudas.map((o) => o.replace(/^\*/, ''));
      pedazos.push({ tipo: 'elegir', opciones });
      solucion.push(idx);
      correcta += opciones[idx];
    }
    ultimo = m.index + m[0].length;
  }
  const resto = item.f.slice(ultimo);
  if (resto) pedazos.push({ tipo: 'texto', html: resto });
  correcta += resto;
  if (item.r && n !== item.r.length) {
    throw new Error(`Sobran respuestas (${item.r.length} para ${n} huecos) en: ${item.f}`);
  }
  // Lo que va entre paréntesis es la pista ("(go)"): no se lee en voz alta. Y
  // en las de transformar ("She plays. → She doesn't play.") se lee el final.
  if (correcta.includes('→')) correcta = correcta.slice(correcta.lastIndexOf('→') + 1);
  correcta = sinEtiquetas(correcta).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  return { pedazos, solucion, correcta, e: item.e, rep: item.rep };
}

export const codificar = (o: unknown) => Buffer.from(JSON.stringify(o), 'utf-8').toString('base64');
