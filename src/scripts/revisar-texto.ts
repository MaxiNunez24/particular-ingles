// Revisor de textos LIBRES (la redacción y las traducciones).
//
// Acá no hay una respuesta única con la que comparar: la alumna escribe su
// propia rutina. Lo que sí se puede hacer es buscar los errores típicos de
// este tema, frase por frase, y decirlos sin corregirlos por ella:
//   · la -s de he/she/it (my mum get up → falta la -s)
//   · la -s de más con I/you/we/they (I gets up)
//   · to be + verbo de acción (I am get up)
//   · preposiciones de tiempo (in 7, at the morning, in Monday)
//   · las combinaciones de la rutina (take breakfast, make homework, go to the bed)
//   · el adverbio de frecuencia después del verbo (I get usually up)
//   · lo que quedó en castellano, la i minúscula
// Los mensajes pueden nombrar la palabra que escribió ella, nunca la correcta.

/** Verbos de rutina en su forma base. */
const VERBOS = new Set(
  ('get go have do leave start finish study make eat drink watch play read walk take work live wake brush ' +
    'cook help listen ride sleep wash use wear meet call travel teach like love hate want need know come visit ' +
    'clean dance run swim write practise practice check buy tidy feed catch drive arrive chat sit stay relax ' +
    'shower prepare open close teach talk text spend finish learn draw sing paint')
    .split(' '),
);

/** La forma con -s de he/she/it. */
export function conS(v: string): string {
  if (v === 'have') return 'has';
  if (v === 'do') return 'does';
  if (v === 'go') return 'goes';
  if (/(ch|sh|ss|x|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}
const FORMAS_S = new Map([...VERBOS].map((v) => [conS(v), v]));

/** Si la palabra parece un verbo de la lista con una -s mal puesta (gos, watchs, studys). */
function sMalEscrita(w: string): boolean {
  if (FORMAS_S.has(w) || VERBOS.has(w) || !w.endsWith('s')) return false;
  const base = w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.endsWith('es') ? w.slice(0, -2) : w.slice(0, -1);
  return VERBOS.has(base) || VERBOS.has(w.slice(0, -1));
}

const ADV = new Set(['always', 'usually', 'often', 'sometimes', 'never', 'also', 'normally', 'generally']);
const TERCERA = /\b(she|he|my mum|my mom|my mother|my dad|my father|mum|mom|dad|it|my sister|my brother|my grandma|my grandpa)\b/g;
const PLURAL = /\b(i|you|we|they|my parents|my friends|my brothers|my sisters)\b/g;
const NUMEROS = 'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve';
const DIAS = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
const cita = (w: string) => `«<span lang="en">${esc(w)}</span>»`;

/** La palabra que sigue a una posición, saltando un adverbio de frecuencia. */
function siguienteVerbo(resto: string): { w: string; adv: boolean } | null {
  const ws = resto.trim().split(/\s+/);
  if (!ws[0]) return null;
  if (ADV.has(ws[0]) && ws[1]) return { w: ws[1], adv: true };
  return { w: ws[0], adv: false };
}

/** Errores típicos en un texto libre. Devuelve mensajes (vacío = no encontró nada). */
export function revisarTexto(texto: string): string[] {
  const msgs: string[] = [];
  const crudo = texto.trim();
  if (!crudo) return msgs;

  // castellano y mayúsculas, sobre el texto tal cual
  if (/[áéíóúñ¿¡]/i.test(crudo) || /\b(y|el|la|los|las|de|del|en|mi|mis|porque|pero|que|después|despues|desayuno|cena|escuela|colegio)\b/i.test(crudo))
    msgs.push('Parece que quedó algo en <b>castellano</b>. Todo el texto va en inglés: si no sabés una palabra, buscala en la ayuda o en el tema de rutinas.');
  if (/(^|[^A-Za-z'])i([\s']|$)/.test(crudo))
    msgs.push('<b>I</b> (yo) va siempre con <b>mayúscula</b>, aunque esté en el medio de la frase.');

  const t = ' ' + crudo.toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?;:()"]/g, ' ').replace(/\s+/g, ' ') + ' ';

  // La palabra anterior al sujeto: en "Does she get up?" o "my mum and dad have"
  // el verbo va sin -s, y no hay que marcarlo.
  const anterior = (i: number) => t.slice(0, i).trim().split(' ').pop() || '';
  const NO_CUENTA = new Set(['does', 'do', "doesn't", "don't", 'did', 'can', 'will', 'and', 'or']);

  // he/she/it (y "my mum", "my dad"...) + verbo sin -s
  for (const m of t.matchAll(TERCERA)) {
    if (NO_CUENTA.has(anterior(m.index || 0))) continue;
    if (/^\s*and\b/.test(t.slice((m.index || 0) + m[0].length))) continue;
    const sig = siguienteVerbo(t.slice((m.index || 0) + m[0].length));
    if (!sig) continue;
    if (sig.w === 'have') msgs.push(`Con ${cita(m[0])} (he/she), <i>have</i> cambia de forma: es irregular. Revisá ${cita(sig.w)}.`);
    else if (VERBOS.has(sig.w)) msgs.push(`Con ${cita(m[0])} (he/she) el verbo lleva <b>-s</b>. Revisá ${cita(sig.w)}.`);
    else if (sMalEscrita(sig.w)) msgs.push(`${cita(sig.w)} tiene la -s, pero mal escrita. Repasá cuándo es <b>-s, -es o -ies</b>.`);
    else if (sig.w === "don't" || (sig.w === 'do' && /^\s*(not|n't)/.test(t.slice((m.index || 0) + m[0].length + 3))))
      msgs.push(`Con ${cita(m[0])} (he/she) el negativo no es <i>don't</i>. Repasá el negativo.`);
  }

  // I/you/we/they + verbo con -s
  for (const m of t.matchAll(PLURAL)) {
    if (NO_CUENTA.has(anterior(m.index || 0)) && anterior(m.index || 0) !== 'and') continue;
    const sig = siguienteVerbo(t.slice((m.index || 0) + m[0].length));
    if (!sig) continue;
    if (FORMAS_S.has(sig.w) && sig.w !== 'is')
      msgs.push(`Con ${cita(m[0] === 'i' ? 'I' : m[0])} el verbo va <b>sin -s</b>. Revisá ${cita(sig.w)}.`);
    else if (sig.w === "doesn't") msgs.push(`Con ${cita(m[0])} el negativo no es <i>doesn't</i>. Repasá el negativo.`);
  }

  // does/doesn't + verbo con -s
  for (const m of t.matchAll(/\b(does|doesn't|does not)\s+(\w+)/g)) {
    const sig = siguienteVerbo(m[2] + t.slice((m.index || 0) + m[0].length));
    if (sig && FORMAS_S.has(sig.w))
      msgs.push(`Después de <i>does / doesn't</i> el verbo va <b>sin -s</b>: la -s aparece una sola vez. Revisá ${cita(sig.w)}.`);
  }

  // to be + verbo de acción (sin -ing)
  for (const m of t.matchAll(/\b(i am|i'm|you are|we are|they are|she is|he is|she's|he's|it's|it is|am|is|are)\s+(\w+)\s/g)) {
    const sig = siguienteVerbo(m[2] + t.slice((m.index || 0) + m[0].length - 1));
    if (sig && (VERBOS.has(sig.w) || FORMAS_S.has(sig.w)))
      msgs.push(`${cita(m[1].replace(/^i\b/, 'I') + ' ' + sig.w)}: no se mezcla <i>am / is / are</i> con un verbo de acción. En una rutina va el verbo solo (y si es "ahora", con -ing).`);
  }

  // el adverbio después del verbo
  for (const m of t.matchAll(/\b(\w+)\s+(always|usually|often|sometimes|never)\b/g)) {
    if (VERBOS.has(m[1]) || FORMAS_S.has(m[1]))
      msgs.push(`${cita(m[2])} va <b>antes</b> del verbo (y después de <i>am/is/are</i>). Revisá ${cita(m[1] + ' ' + m[2])}.`);
  }

  // preposiciones de tiempo
  if (new RegExp(`\\b(in|on)\\s+(\\d|${NUMEROS}|half|quarter)\\b`).test(t))
    msgs.push('Para decir <b>a qué hora</b> va <b>at</b> (at 7.00, at half past seven).');
  if (/\bat\s+the\s+(morning|afternoon|evening)\b/.test(t))
    msgs.push('Las partes del día van con <b>in</b>: in the morning, in the afternoon, in the evening.');
  if (/\b(in|on)\s+(the\s+)?night\b/.test(t)) msgs.push('A la noche es <b>at night</b>.');
  if (new RegExp(`\\b(in|at)\\s+(${DIAS})\\b`).test(t)) msgs.push('Los días de la semana van con <b>on</b>: on Monday.');
  if (new RegExp(`\\b(${DIAS})\\b`).test(t) && new RegExp(`\\b(${DIAS})\\b`).test(' ' + crudo.replace(/[.,!?]/g, ' ') + ' '))
    msgs.push('Los días de la semana van con <b>mayúscula</b> en inglés: Monday, Tuesday…');

  // combinaciones de la rutina
  if (/\b(take|takes|eat|eats)\s+(a\s+|my\s+|the\s+)?(breakfast|lunch|dinner)\b/.test(t))
    msgs.push('Las comidas van con <b>have</b>: have breakfast, have lunch, have dinner.');
  if (/\b(make|makes)\s+(my|his|her|the|their|our)?\s*homework\b/.test(t)) msgs.push('La tarea va con <b>do</b>, no con <i>make</i>.');
  if (/\bgo(es)?\s+to\s+the\s+bed\b/.test(t)) msgs.push('Es <b>go to bed</b>, sin <i>the</i>.');
  if (/\b(go|goes|get|gets)\s+to\s+home\b/.test(t)) msgs.push('Con <i>home</i> no va <i>to</i>: go home, get home.');
  if (/\bleave(s)?\s+from\s+home\b/.test(t)) msgs.push('Es <b>leave home</b>, sin <i>from</i>.');
  if (/\b(don't|doesn't)\s+never\b/.test(t)) msgs.push('<i>Never</i> ya es negativo: no va con <i>don\'t / doesn\'t</i>.');

  return [...new Set(msgs)];
}

/** Conectores que reconoce (para contarlos en la redacción). */
export const CONECTORES: { en: string; re: RegExp }[] = [
  { en: 'First', re: /\bfirst\b/i },
  { en: 'Then', re: /\bthen\b/i },
  { en: 'After that', re: /\bafter that\b/i },
  { en: 'After (school, lunch…)', re: /\bafter (school|lunch|breakfast|dinner|class|work|that)\b/i },
  { en: 'Before', re: /\bbefore\b/i },
  { en: 'Finally', re: /\bfinally\b/i },
  { en: 'and', re: /\band\b/i },
  { en: 'but', re: /\bbut\b/i },
  { en: 'because', re: /\bbecause\b/i },
  { en: 'so', re: /\bso\b/i },
  { en: 'also / too', re: /\b(also|too)\b/i },
  { en: 'Usually / always…', re: /\b(usually|always|often|sometimes|never)\b/i },
  { en: 'When', re: /\bwhen\b/i },
];

export function conectoresUsados(texto: string): string[] {
  return CONECTORES.filter((c) => c.re.test(texto)).map((c) => c.en);
}
