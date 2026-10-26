// La lista de temas, en orden. Es la ÚNICA fuente: de acá salen el menú de la
// izquierda (astro.config.mjs) y el progreso de la portada (Progreso.astro).
// Para agregar un tema, se agrega acá y aparece en los dos lados.
//
// `ejercicios: false` = página sin ejercicios (no cuenta en el progreso).

export const GRUPOS = [
  {
    grupo: '🧱 Las bases',
    temas: [
      { titulo: '1. Pronombres y verbo to be', link: '/bases/to-be/' },
      { titulo: '2. La hora y cuándo pasa algo', link: '/bases/la-hora/' },
      { titulo: '3. Días, meses y estaciones', link: '/bases/dias-meses/' },
    ],
  },
  {
    grupo: '🔁 Present Simple',
    temas: [
      { titulo: '4. Rutinas (vocabulario)', link: '/present-simple/rutinas/' },
      { titulo: '5. Afirmativo: la -s', link: '/present-simple/afirmativo/' },
      { titulo: '6. Negativo y preguntas', link: '/present-simple/negativo-preguntas/' },
      { titulo: '7. ¿Con qué frecuencia?', link: '/present-simple/frecuencia/' },
    ],
  },
  {
    grupo: '🎬 Present Continuous',
    temas: [
      { titulo: '8. Lo que pasa ahora', link: '/present-continuous/' },
      { titulo: '9. ¿Simple o Continuous?', link: '/simple-o-continuous/' },
    ],
  },
  {
    grupo: '✍️ Redacción',
    temas: [
      { titulo: '10. Conectores y frases útiles', link: '/redaccion/conectores/' },
      { titulo: '11. Traducir frases', link: '/redaccion/traducir/' },
      { titulo: '12. Mi rutina y la de mi familia', link: '/redaccion/mi-rutina/' },
    ],
  },
  {
    grupo: '🎯 Para el examen',
    temas: [
      { titulo: '13. Errores típicos', link: '/examen/errores-tipicos/' },
      { titulo: '14. Simulacro', link: '/examen/simulacro/' },
      { titulo: '📄 Machete (resumen)', link: '/examen/machete/', ejercicios: false },
    ],
  },
];

/** El menú de Starlight, armado con la misma lista. */
export const sidebar = [
  { label: '🏠 Inicio', link: '/' },
  ...GRUPOS.map((g) => ({ label: g.grupo, items: g.temas.map((t) => ({ label: t.titulo, link: t.link })) })),
];
