import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { sitio } from './sitio.js';
import fs from 'node:fs';

// Posts con  noListado: true  → no entran en el sitemap (tampoco en listas, buscador ni RSS)
const carpeta = './src/content/posts';
let ocultos = [];
try {
  ocultos = fs
    .readdirSync(carpeta)
    .filter((f) => /\.mdx?$/.test(f))
    .filter((f) => /^noListado:\s*true\s*$/m.test(fs.readFileSync(`${carpeta}/${f}`, 'utf8').split(/^---\s*$/m)[1] ?? ''))
    .map((f) => f.replace(/\.mdx?$/, ''));
} catch {}

// La dirección y la carpeta (base) se toman de sitio.js → url y base
// mdx() permite escribir artículos en .mdx además de .md
export default defineConfig({
  site: new URL(sitio.url).origin, // solo el dominio, ej: https://olialex.github.io
  base: sitio.base || '/', // la carpeta del repositorio, ej: /cuaderno (vacío si el sitio va en la raíz)
  integrations: [mdx(), sitemap({ filter: (pagina) => !ocultos.some((s) => pagina.includes(`/articulo/${s}/`)) })],
  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
  },
});
