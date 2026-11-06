// ============================================================================
//  imagenes.js — Astro procesa las imágenes de  src/assets/
//  En sitio.js y en los artículos sigues escribiendo  /img/foto.webp
//  → el archivo real está en  src/assets/img/foto.webp  y Astro lo optimiza al compilar
//  (varios tamaños, WebP, con ancho y alto para que la página no salte).
//  Lo que no esté en src/assets (enlaces https://… o archivos de public/) se usa tal cual.
// ============================================================================
import { getImage } from 'astro:assets';
import { ruta } from './utils.js';

const todas = import.meta.glob('/src/assets/**/*.{jpg,jpeg,png,webp,avif,gif}', { eager: true, import: 'default' });

export const metaDe = (r) => (typeof r === 'string' && r.startsWith('/') ? todas['/src/assets' + r] : undefined);

// Una sola URL optimizada (para fondos de novela, páginas de cómic, imagen al compartir…)
export async function urlImagen(r, ancho = 1200, formato = 'webp') {
  if (!r) return undefined;
  const m = metaDe(r);
  if (!m) return ruta(r);
  return (await getImage({ src: m, width: Math.min(ancho, m.width), format: formato, quality: 80 })).src;
}

// Varios tamaños para <img srcset>. Devuelve null si la imagen no está en src/assets.
export async function variantes(r, anchos = [320, 640, 960, 1400], formato = 'webp') {
  const m = metaDe(r);
  if (!m) return null;
  let lista = [...new Set(anchos.map((w) => Math.min(w, m.width)))].sort((a, b) => a - b);
  if (!lista.length) lista = [m.width];
  const imgs = await Promise.all(lista.map((w) => getImage({ src: m, width: w, format: formato, quality: 80 })));
  const ultimo = lista[lista.length - 1];
  return {
    src: imgs[imgs.length - 1].src,
    srcset: imgs.map((im, i) => `${im.src} ${lista[i]}w`).join(', '),
    width: ultimo,
    height: Math.round((ultimo * m.height) / m.width),
  };
}
