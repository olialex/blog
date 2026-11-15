// Imágenes administradas desde src/assets/img.
// En el contenido se escriben con la ruta pública corta: /img/foto.webp.
// Si el archivo existe en src/assets, Astro lo optimiza; si no, se sirve desde public/.
import { getImage } from 'astro:assets';
import { ruta } from './utils.js';

const todas = import.meta.glob('/src/assets/**/*.{jpg,jpeg,png,webp,avif,gif}', {
  eager: true,
  import: 'default',
});

function claveAsset(rutaImagen) {
  if (typeof rutaImagen !== 'string' || !rutaImagen.startsWith('/')) return null;
  if (rutaImagen.startsWith('/src/assets/')) return rutaImagen;
  // Convención del proyecto: /img/foto.webp apunta a src/assets/img/foto.webp.
  if (rutaImagen.startsWith('/img/')) return `/src/assets${rutaImagen}`;
  return `/src/assets${rutaImagen}`;
}

export const metaDe = (r) => {
  const clave = claveAsset(r);
  return clave ? todas[clave] : undefined;
};

export async function urlImagen(r, ancho = 1200, formato = 'webp') {
  if (!r) return undefined;
  const meta = metaDe(r);
  if (!meta) return ruta(r);
  return (await getImage({
    src: meta,
    width: Math.min(ancho, meta.width),
    format: formato,
    quality: 80,
  })).src;
}

export async function variantes(r, anchos = [320, 640, 960, 1400], formato = 'webp') {
  const meta = metaDe(r);
  if (!meta) return null;
  const lista = [...new Set(anchos.map((w) => Math.min(w, meta.width)))].sort((a, b) => a - b);
  if (!lista.length) lista.push(meta.width);
  const imgs = await Promise.all(lista.map((w) => getImage({ src: meta, width: w, format: formato, quality: 80 })));
  const ultimo = lista[lista.length - 1];
  return {
    src: imgs[imgs.length - 1].src,
    srcset: imgs.map((im, i) => `${im.src} ${lista[i]}w`).join(', '),
    width: ultimo,
    height: Math.round((ultimo * meta.height) / meta.width),
  };
}
