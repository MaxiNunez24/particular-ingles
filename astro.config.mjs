// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { writeFileSync } from 'node:fs';
import { sidebar } from './src/data/temas.mjs';

// Se publica en GitHub Pages como sitio de proyecto:
//   https://maxinunez24.github.io/particular-ingles/
// De ahí el `base`: sin él, todos los links y assets apuntarían a la raíz del
// dominio y darían 404 en producción.
const base = '/particular-ingles';

// Versión de este build. GitHub Pages manda las páginas con `max-age=600` y
// algunas tablets las retienen mucho más: la alumna recargaba y seguía viendo
// la versión vieja. Cada página trae su versión adentro y, al abrirse, la
// compara con /version.json (pedido SIN caché). Si hay una más nueva, se
// recarga sola con `?v=` en la dirección, que para la caché es otra página.
const VERSION = (process.env.GITHUB_SHA || '').slice(0, 7) + '-' + Date.now().toString(36);

/** Escribe dist/version.json al terminar el build (en dev no existe: no se chequea nada). */
const versionJson = {
  name: 'version-json',
  hooks: {
    'astro:build:done': ({ dir }) => {
      writeFileSync(new URL('version.json', dir), JSON.stringify({ v: VERSION }));
    },
  },
};

// Corre ANTES que todo lo demás y sin esperar a nada. Evita el bucle: si ya se
// recargó por esta versión en esta página y sigue vieja (la CDN tarda unos
// segundos en actualizarse), no insiste.
// También al volver a una pestaña que el navegador "revive" de su memoria
// (atrás/adelante), que no vuelve a pedir la página.
const chequeoVersion =
  `(function(){var v=${JSON.stringify(VERSION)};function chequear(){` +
  `fetch(${JSON.stringify(base + '/version.json')}+'?t='+Date.now(),{cache:'no-store'})` +
  `.then(function(r){return r.ok?r.json():null}).then(function(d){` +
  `if(!d||!d.v||d.v===v)return;` +
  `var k='pc:recarga:'+d.v+':'+location.pathname;` +
  `try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){return}` +
  `var u=new URL(location.href);u.searchParams.set('v',d.v);location.replace(u.toString())` +
  `}).catch(function(){})}chequear();` +
  `addEventListener('pageshow',function(e){if(e.persisted)chequear()})})();`;

// https://astro.build/config
export default defineConfig({
  site: 'https://maxinunez24.github.io',
  base,
  // gfm explícito: Astro 6.4 lo dejó como `undefined` al deprecarlo, y
  // @astrojs/mdx hace {...defaults, ...markdownConfig} — ese undefined pisa el
  // default y GFM queda APAGADO para .mdx (las tablas salen con los pipes crudos).
  markdown: { gfm: true },
  integrations: [
    versionJson,
    starlight({
      title: 'Inglés: los presentes',
      locales: {
        root: { label: 'Español', lang: 'es' },
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css'],
      // Sidebars redimensionables (el mismo script que la plataforma del CFP):
      // arrastrar el borde para ajustar, doble clic para ocultar. Lleva el
      // `base` adelante: sin él, en producción se busca en la raíz y da 404.
      // El `?v=` es para que el navegador no use una copia vieja del archivo
      // (los de /public no llevan el hash en el nombre como los de _astro/).
      head: [
        { tag: 'script', content: chequeoVersion },
        { tag: 'script', attrs: { src: `${base}/sidebars-resizable.js?v=${VERSION}`, defer: true } },
        // 💬 "Consultar con el profe" en cada ejercicio (abre WhatsApp).
        { tag: 'script', attrs: { src: `${base}/consultar.js?v=${VERSION}`, defer: true } },
      ],
      // El menú sale de src/data/temas.mjs (la misma lista que usa el progreso de la portada).
      sidebar,
    }),
  ],
});
