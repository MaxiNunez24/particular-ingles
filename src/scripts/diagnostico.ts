// Diagnóstico de una respuesta: compara lo que escribió la alumna con lo que
// se esperaba y dice QUÉ TIPO de error es, sin decir la respuesta.
//
// La idea es que el mensaje la mande a pensar ("al verbo le sobra la -s:
// ¿después de does va con -s?") y no a copiar. Por eso los mensajes nunca
// nombran la palabra correcta; sí pueden nombrar la que escribió ella.

/** Para comparar: sin mayúsculas, sin puntuación, y con las contracciones
 *  abiertas (doesn't = does not, I'm = I am). */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?¿¡;:"]/g, ' ')
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bcannot\b/g, 'can not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am')
    .replace(/'re\b/g, ' are')
    .replace(/\b(he|she|it|what|where|who|that|there|how)'s\b/g, '$1 is')
    .replace(/\s+/g, ' ')
    .trim();
}

const palabras = (s: string) => (normalizar(s) ? normalizar(s).split(' ') : []);
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
const cita = (w: string) => `«<span lang="en">${esc(w)}</span>»`;

const BE = new Set(['am', 'is', 'are']);
const PREP = new Set(['at', 'in', 'on']);
const FRECUENCIA = new Set(['always', 'usually', 'often', 'sometimes', 'never', 'hardly', 'ever']);

/** El verbo sin la -s de he/she/it (watches → watch, studies → study). */
function sinS(w: string): string {
  if (w === 'has') return 'have';
  if (w === 'does') return 'do';
  if (w === 'goes') return 'go';
  if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + 'y';
  if (/(ch|sh|ss|x|o)es$/.test(w)) return w.slice(0, -2);
  if (/[^s]s$/.test(w) && w.length > 2) return w.slice(0, -1);
  return w;
}
const llevaS = (w: string) => sinS(w) !== w;

/** Las formas base posibles de un verbo con -ing (making → mak, make; running → run). */
function sinIng(w: string): string[] {
  if (!w.endsWith('ing') || w.length < 5) return [];
  const raiz = w.slice(0, -3);
  const op = [raiz, raiz + 'e'];
  if (/(.)\1$/.test(raiz)) op.push(raiz.slice(0, -1));
  return op;
}

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Qué está mal en UNA palabra que debería ser otra. */
function palabraMal(x: string, y: string, frase: string[]): string {
  if (x === 'do' && y === 'does')
    return '<i>Do</i> no corresponde a ese sujeto. Fijate quién es: ¿es <b>he, she o it</b> (una sola persona o cosa)?';
  if (x === 'does' && y === 'do')
    return '<i>Does</i> no corresponde a ese sujeto. Con <b>I, you, we, they</b> (o varias personas) no lleva -s.';
  if (BE.has(x) && BE.has(y))
    return 'Esa forma de <i>to be</i> no va con ese sujeto. Repasá cuál va con <b>I</b>, cuál con <b>he/she/it</b> y cuál con <b>you/we/they</b>.';
  if (PREP.has(x) && PREP.has(y))
    return 'Esa preposición no va. Pensá si es una <b>hora</b>, una <b>parte del día</b> o un <b>día</b>.';

  // -ing
  if (y.endsWith('ing') && x.endsWith('ing'))
    return `${cita(x)} tiene el -ing, pero está mal escrito. Repasá las reglas: ¿se va la <b>-e</b>? ¿se <b>duplica</b> la última letra?`;
  if (y.endsWith('ing') && (sinIng(y).includes(x) || sinIng(y).includes(sinS(x))))
    return `A ${cita(x)} le falta algo: en el <b>Present Continuous</b> el verbo lleva <b>-ing</b>.`;
  if (x.endsWith('ing') && (sinIng(x).includes(y) || sinIng(x).includes(sinS(y))))
    return `Acá no va <b>-ing</b>. ¿Es algo que pasa <b>ahora</b>, o <b>siempre / normalmente</b>? Y ojo: <i>like, love, want, need, know</i> nunca van con -ing.`;

  // la -s de he/she/it
  if (sinS(x) === sinS(y)) {
    if (y === 'has' && x === 'have')
      return 'Fijate el sujeto: con <b>he/she/it</b>, <i>have</i> cambia de forma (es irregular).';
    if (llevaS(y) && !llevaS(x))
      return `A ${cita(x)} le falta la <b>-s</b>. ¿El sujeto es <b>he, she o it</b> (una sola persona, animal o cosa)?`;
    if (!llevaS(y) && llevaS(x)) {
      const conAyudante = frase.some((w) => w === 'does' || w === 'do');
      return conAyudante
        ? `A ${cita(x)} le sobra la -s. Cuando ya está <b>does / doesn't / do / don't</b>, el verbo va sin -s: la -s aparece una sola vez.`
        : `A ${cita(x)} le sobra la -s. Con <b>I, you, we, they</b> (o con varias personas) el verbo va sin -s.`;
    }
    return `${cita(x)} tiene la -s, pero mal escrita. Repasá cuándo es <b>-s</b>, <b>-es</b> o <b>-ies</b>.`;
  }

  if (x === 'not' || y === 'not') return 'Revisá si la frase tiene que ser <b>afirmativa o negativa</b>.';
  const VECES = new Set(['once', 'twice', 'three', 'four', 'five', 'times', 'every']);
  if (VECES.has(x) && VECES.has(y))
    return `${cita(x)} no es la cantidad de veces que pide. Mirá lo que dice entre paréntesis.`;
  if (FRECUENCIA.has(x) && FRECUENCIA.has(y))
    return `${cita(x)} no es la frecuencia que pide. Repasá qué porcentaje es cada adverbio.`;
  if (y.length > 3 && distancia(x, y) <= 2)
    return `Casi: revisá cómo se escribe ${cita(x)} (hay una letra de más, de menos o cambiada).`;
  return `${cita(x)} no es la palabra que va ahí.`;
}

/** Diagnostica una respuesta contra UNA forma esperada. */
function contra(crudo: string, esperado: string): string[] {
  const a = palabras(crudo);
  const b = palabras(esperado);
  if (!a.length) return ['Falta completar este hueco.'];

  const sinApostrofo = (s: string) => s.toLowerCase().replace(/['’]/g, '').replace(/[.?!]/g, '').trim();
  if (sinApostrofo(crudo) === sinApostrofo(esperado) && crudo.trim().toLowerCase() !== esperado.toLowerCase())
    return ["Está casi: te faltó el <b>apóstrofo</b> ( ' ) de la contracción."];

  // Mismas palabras, otro orden.
  if (a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ')) {
    const adv = a.find((w) => FRECUENCIA.has(w));
    if (adv && b.some((w) => BE.has(w)))
      return [`Están todas las palabras, pero en otro orden. ¿Dónde va ${cita(adv)} cuando hay <i>am/is/are</i>? ¿Y con los demás verbos?`];
    if (adv) return [`Están todas las palabras, pero en otro orden. Repasá dónde va ${cita(adv)}: ¿antes o después del verbo?`];
    return ['Están todas las palabras, pero en otro orden. Repasá el orden de la pregunta: <b>(palabra de pregunta) + ayudante + sujeto + verbo</b>.'];
  }

  // Errores de "estructura" que se ven mirando la frase entera, antes de
  // comparar palabra por palabra.
  const AUX = (w: string) => w === 'do' || w === 'does';
  const hayIng = (ws: string[]) => ws.some((w) => w.endsWith('ing') && w.length > 4);
  const globales: string[] = [];
  if (hayIng(a) && !hayIng(b) && a.some((w) => sinIng(w).some((r) => b.includes(r) || b.map(sinS).includes(r))))
    globales.push('Acá no va <b>-ing</b>. ¿Es algo que pasa <b>ahora</b>, o <b>siempre / normalmente</b>? Y ojo: <i>like, love, want, need, know</i> nunca van con -ing.');
  if (a.some(AUX) && hayIng(b) && !b.some(AUX))
    globales.push('En el <b>Present Continuous</b> no se usa <i>do / does</i>: las preguntas y negativas se hacen con <i>am/is/are</i>.');
  if (a.includes('not') && b.includes('never') && !b.includes('not'))
    globales.push('<i>Never</i> ya es negativo: no hace falta <i>not</i> (ni <i>don\'t</i>).');
  if (globales.length) return globales;
  if (b.some(AUX) && !a.some(AUX)) {
    const msgs = ['Falta el ayudante: las preguntas y negativas del Present Simple llevan <b>do / does</b>.'];
    const bSin = b.filter((w) => !AUX(w));
    if (bSin.length === a.length) {
      // Sin el ayudante, ¿el resto está en orden? Si no, puede que además sobre la -s.
      bSin.forEach((y, i) => {
        if (a[i] !== y && sinS(a[i]) === sinS(y)) msgs.push(palabraMal(a[i], y, b));
      });
    }
    return msgs;
  }

  if (a.length === b.length) {
    const msgs: string[] = [];
    a.forEach((x, i) => {
      if (x !== b[i]) msgs.push(palabraMal(x, b[i], a));
    });
    return [...new Set(msgs)];
  }

  const esSub = (corta: string[], larga: string[]) => {
    let j = 0;
    for (const w of larga) if (w === corta[j]) j++;
    return j === corta.length;
  };

  if (a.length < b.length && esSub(a, b)) {
    const faltan = [...b];
    a.forEach((w) => faltan.splice(faltan.indexOf(w), 1));
    if (faltan.some((w) => BE.has(w)) && b.some((w) => w.endsWith('ing')))
      return ['Falta una pieza: el <b>Present Continuous</b> se arma con <b>am/is/are + verbo-ing</b>.'];
    if (faltan.some((w) => w === 'do' || w === 'does'))
      return ['Falta el ayudante: las preguntas y negativas del Present Simple llevan <b>do / does</b>.'];
    if (faltan.includes('not')) return ['Falta la parte <b>negativa</b>.'];
    return [faltan.length === 1 ? 'Te falta una palabra.' : `Te faltan ${faltan.length} palabras.`];
  }

  if (a.length > b.length && esSub(b, a)) {
    const sobran = [...a];
    b.forEach((w) => sobran.splice(sobran.indexOf(w), 1));
    const s = sobran[0];
    if (BE.has(s) && !b.some((w) => w.endsWith('ing')))
      return [`Sobra ${cita(s)}: con los verbos de acción no se usa <i>am/is/are</i> (eso es para <i>to be</i> y el Present Continuous).`];
    if ((s === 'do' || s === 'does') && b.some((w) => w.endsWith('ing')))
      return ['En el <b>Present Continuous</b> no se usa <i>do / does</i>: las preguntas y negativas se hacen con <i>am/is/are</i>.'];
    if (s === 'not' && b.includes('never')) return ['<i>Never</i> ya es negativo: no hace falta <i>not</i>.'];
    if (s === 'the' && b.includes('bed')) return ['Sobra el <i>the</i>: esa expresión va sin artículo.'];
    return [sobran.length === 1 ? `Sobra ${cita(s)}.` : `Sobran palabras: ${sobran.map(cita).join(', ')}.`];
  }

  // Distinta cantidad y distintas palabras: buscamos la diferencia más chica
  // alineando por posición, y si no, un mensaje general.
  const comunes = a.filter((w) => b.includes(w)).length;
  if (comunes >= Math.min(a.length, b.length) - 1) {
    const msgs: string[] = [];
    a.forEach((x, i) => {
      if (b[i] !== undefined && x !== b[i]) msgs.push(palabraMal(x, b[i], a));
    });
    if (msgs.length) return [...new Set(msgs)].slice(0, 2);
  }
  return ['Esa no es la respuesta. Volvé a leer la consigna y el tema, y probá de nuevo.'];
}

/** Diagnostica contra todas las formas aceptadas y se queda con la más parecida. */
export function diagnosticar(crudo: string, aceptadas: string[]): string[] | null {
  if (aceptadas.some((x) => normalizar(x) === normalizar(crudo)) && crudo.trim()) return null;
  const masParecida = [...aceptadas].sort(
    (x, y) => distancia(normalizar(crudo), normalizar(x)) - distancia(normalizar(crudo), normalizar(y)),
  )[0];
  return contra(crudo, masParecida);
}
