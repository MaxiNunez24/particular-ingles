// Los conectores y frases útiles para contar una rutina, con su significado.
// Los usa la página de conectores y la ayuda de cada redacción, así son
// siempre los mismos en los dos lados.

export interface Conector {
  en: string;
  es: string;
  ejemplo: string;
}

export const CONECTORES: { grupo: string; items: Conector[] }[] = [
  {
    grupo: '🔢 Para ordenar lo que hacés',
    items: [
      { en: 'First, …', es: 'Primero…', ejemplo: 'First, I get up and have a shower.' },
      { en: 'Then, …', es: 'Después / luego…', ejemplo: 'Then, I have breakfast.' },
      { en: 'After that, …', es: 'Después de eso…', ejemplo: 'After that, I leave home.' },
      { en: 'After school / after lunch', es: 'Después de la escuela / del almuerzo', ejemplo: 'After school, I do my homework.' },
      { en: 'Before …', es: 'Antes de…', ejemplo: 'I have a snack before dinner.' },
      { en: 'Finally, …', es: 'Por último / al final…', ejemplo: 'Finally, I go to bed at 11.' },
    ],
  },
  {
    grupo: '🔗 Para unir ideas',
    items: [
      { en: 'and', es: 'y', ejemplo: 'I get dressed and I have breakfast.' },
      { en: 'but', es: 'pero', ejemplo: 'I get up early, but my brother gets up late.' },
      { en: 'because', es: 'porque', ejemplo: 'I walk to school because it is near my house.' },
      { en: 'so', es: 'así que / por eso', ejemplo: 'My mum works late, so we have dinner at 10.' },
      { en: 'also / too', es: 'también', ejemplo: 'She also teaches English. / I like Maths too.' },
      { en: 'when', es: 'cuando', ejemplo: 'When I get home, I make a snack.' },
    ],
  },
  {
    grupo: '⏰ Para decir cuándo y cada cuánto',
    items: [
      { en: 'in the morning / afternoon / evening', es: 'a la mañana / tarde / noche (temprano)', ejemplo: 'In the morning, I go to school.' },
      { en: 'at night', es: 'a la noche', ejemplo: 'At night, I read a book.' },
      { en: 'at 7.00 / at about 7.00', es: 'a las 7 / a eso de las 7', ejemplo: 'We have dinner at about 9.00.' },
      { en: 'on Monday / on weekdays', es: 'el lunes / los días de semana', ejemplo: 'On weekdays, my dad works in an office.' },
      { en: 'at the weekend', es: 'el fin de semana', ejemplo: 'At the weekend, I get up late.' },
      { en: 'always / usually / sometimes / never', es: 'siempre / generalmente / a veces / nunca', ejemplo: 'My mum usually cooks dinner.' },
    ],
  },
];
