// Utilidades de la galería que solo leen archivos (sin Astro), para usarlas en astro.config.mjs y en el plugin de Markdown.
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = () => path.join(process.cwd(), 'public', 'galeria');
const OK = /^[a-z0-9][a-z0-9-]*$/;

export function leerAlbumFs(ruta) {
  const partes = String(ruta).split('/').filter(Boolean);
  if (!partes.length || partes.length > 4 || !partes.every((p) => OK.test(p))) return null;
  try { return JSON.parse(fs.readFileSync(path.join(RAIZ(), ...partes, 'album.json'), 'utf8')); } catch { return null; }
}

// Rutas de álbumes no listados (un subálbum de un álbum oculto también queda oculto)
export function albumesOcultos() {
  const salida = [];
  const recorrer = (dir, partes, oculto) => {
    let items;
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (!it.isDirectory() || !OK.test(it.name)) continue;
      const p = [...partes, it.name];
      const a = leerAlbumFs(p.join('/'));
      if (!a) continue;
      const o = oculto || Boolean(a.noListado);
      if (o) salida.push(p.join('/'));
      recorrer(path.join(dir, it.name), p, o);
    }
  };
  recorrer(RAIZ(), [], false);
  return salida;
}
