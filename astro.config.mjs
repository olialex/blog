import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { sitio } from './sitio.js';

// La dirección y la carpeta (base) se toman de sitio.js → url y base
// mdx() permite escribir artículos en .mdx además de .md
export default defineConfig({
  site: new URL(sitio.url).origin, // solo el dominio, ej: https://olialex.github.io
  base: sitio.base || '/', // la carpeta del repositorio, ej: /cuaderno (vacío si el sitio va en la raíz)
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
  },
  prefetch: { prefetchAll: true },
});
