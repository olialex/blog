// Lee public/galeria (lo que crea el panel) al compilar y lo entrega listo para las páginas.
import fs from 'node:fs';
import path from 'node:path';
import { sitio } from '../../sitio.js';
import { ruta } from './utils.js';

const RAIZ = path.join(process.cwd(), 'public', 'galeria');
export const cfg = sitio.galeria ?? {};
export const urlBase = (cfg.urlBase || '/galeria').replace(/\/$/, '');

function leer(dir, partes, padre) {
  let a;
  try { a = JSON.parse(fs.readFileSync(path.join(dir, 'album.json'), 'utf8')); } catch { return null; }
  const fotos = Array.isArray(a.fotos) ? a.fotos : [];
  const al = {
    ruta: partes.join('/'),
    partes,
    nivel: partes.length,
    titulo: a.titulo || partes.at(-1),
    descripcion: a.descripcion || '',
    fecha: a.fecha || '',
    etiquetas: a.etiquetas ?? [],
    noListado: Boolean(a.noListado) || Boolean(padre?.noListado), // un subálbum de uno oculto también queda oculto
    portadaId: a.portada || fotos[0]?.id || '',
    fotos,
    padre: padre?.ruta ?? null,
    hijos: [],
  };
  for (const it of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!it.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(it.name)) continue;
    const h = leer(path.join(dir, it.name), [...partes, it.name], al);
    if (h) al.hijos.push(h);
  }
  al.hijos.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));
  return al;
}

let cache;
export function arbolAlbumes() {
  if (cache) return cache;
  const raices = [];
  try {
    for (const it of fs.readdirSync(RAIZ, { withFileTypes: true })) {
      if (!it.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(it.name)) continue;
      const a = leer(path.join(RAIZ, it.name), [it.name], null);
      if (a) raices.push(a);
    }
  } catch {}
  raices.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));
  return (cache = raices);
}

export function todosAlbumes(lista = arbolAlbumes()) {
  return lista.flatMap((a) => [a, ...todosAlbumes(a.hijos)]);
}
export const albumesPublicos = () => arbolAlbumes().filter((a) => !a.noListado);
export const buscarAlbum = (r) => todosAlbumes().find((a) => a.ruta === r);
export const fotoUrl = (a, id, tipo = 'm') => ruta(`${urlBase}/${a.ruta}/${id}-${tipo}.webp`);
export const albumUrl = (a, id) => ruta(`/galeria/${a.ruta}/`) + (id ? `#${id}` : '');
export const totalFotos = (a) => a.fotos.length + a.hijos.reduce((n, h) => n + totalFotos(h), 0);

// Portada de un álbum: la elegida o la primera foto (si no tiene fotos, la de su primer subálbum con fotos)
export function portadaAlbum(a) {
  if (a.fotos.length) return fotoUrl(a, a.portadaId, 'm');
  for (const h of a.hijos) { const p = portadaAlbum(h); if (p) return p; }
  return '';
}
export const miga = (a) => {
  const salida = [];
  for (let i = 1; i <= a.partes.length; i++) { const x = buscarAlbum(a.partes.slice(0, i).join('/')); if (x) salida.push(x); }
  return salida;
};
