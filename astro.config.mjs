// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Se publica en GitHub Pages como sitio de proyecto:
//   https://maxinunez24.github.io/particular-ingles/
// De ahí el `base`: sin él, todos los links y assets apuntarían a la raíz del
// dominio y darían 404 en producción.
const base = '/particular-ingles';

// https://astro.build/config
export default defineConfig({
  site: 'https://maxinunez24.github.io',
  base,
  // gfm explícito: Astro 6.4 lo dejó como `undefined` al deprecarlo, y
  // @astrojs/mdx hace {...defaults, ...markdownConfig} — ese undefined pisa el
  // default y GFM queda APAGADO para .mdx (las tablas salen con los pipes crudos).
  markdown: { gfm: true },
  integrations: [
    starlight({
      title: 'Inglés: los presentes',
      locales: {
        root: { label: 'Español', lang: 'es' },
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: '🏠 Inicio', link: '/' },
        {
          label: '🧱 Las bases',
          items: [
            { label: '1. Pronombres y verbo to be', link: '/bases/to-be/' },
            { label: '2. La hora y cuándo pasa algo', link: '/bases/la-hora/' },
          ],
        },
        {
          label: '🔁 Present Simple',
          items: [
            { label: '3. Rutinas (vocabulario)', link: '/present-simple/rutinas/' },
            { label: '4. Afirmativo: la -s', link: '/present-simple/afirmativo/' },
            { label: '5. Negativo y preguntas', link: '/present-simple/negativo-preguntas/' },
            { label: '6. ¿Con qué frecuencia?', link: '/present-simple/frecuencia/' },
          ],
        },
        {
          label: '🎬 Present Continuous',
          items: [
            { label: '7. Lo que pasa ahora', link: '/present-continuous/' },
            { label: '8. ¿Simple o Continuous?', link: '/simple-o-continuous/' },
          ],
        },
        {
          label: '🎯 Para el examen',
          items: [
            { label: '9. Errores típicos', link: '/examen/errores-tipicos/' },
            { label: '10. Simulacro', link: '/examen/simulacro/' },
            { label: '📄 Machete (resumen)', link: '/examen/machete/' },
          ],
        },
      ],
    }),
  ],
});
