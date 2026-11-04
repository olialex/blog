import { getCollection } from 'astro:content';
import { sitio } from '../../sitio.js';

// Todos los artículos, del más nuevo al más viejo (los borradores solo se ven en desarrollo)
export async function getPosts() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.borrador);
  return posts.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

// Agrega la base del sitio (astro.config.mjs → base) a un enlace interno: '/articulos/' → '/mi-repo/articulos/'
// Los enlaces externos (https://, mailto:) y los anclajes (#) se dejan igual.
export function ruta(url = '/') {
  if (!url || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return url;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? base + url : url;
}

export function urlPost(post) {
  return ruta(`/articulo/${post.slug}/`);
}

export function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function tiempoLectura(texto = '') {
  const palabras = texto.trim().split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
}

export function formatoFecha(fecha, opciones) {
  return new Intl.DateTimeFormat(sitio.idioma, {
    timeZone: 'UTC',
    ...(opciones ?? { day: '2-digit', month: 'short', year: 'numeric' }),
  }).format(fecha);
}

// ===== WEBCOMICS =====
// Un artículo es webcomic cuando su frontmatter tiene tipo: webcomic y una lista comic.paginas
export function esComic(post) {
  return post.data.tipo === 'webcomic' && Boolean(post.data.comic?.paginas?.length);
}

export function esNovela(post) {
  return post.data.tipo === 'novela' && Boolean(post.data.novela?.escenas?.length);
}
export function escenasNovela(post) {
  return post.data.novela.escenas.map((e) => ({
    ...e,
    imagen: ruta(e.imagen),
    capas: e.capas.map((c) => ({ ...c, imagen: ruta(c.imagen) })),
  }));
}

// Convierte cada página (texto u objeto) a { imagen, alt, nota }
export function paginasComic(post) {
  return (post.data.comic?.paginas ?? []).map((p) =>
    typeof p === 'string'
      ? { imagen: ruta(p), alt: '', nota: '' }
      : { imagen: ruta(p.imagen), alt: p.alt ?? '', nota: p.nota ?? '' },
  );
}

// Imagen de portada: la del artículo o, si es webcomic, su primera página
export function portadaDe(post) {
  return post.data.portada ? ruta(post.data.portada) : esComic(post) ? paginasComic(post)[0]?.imagen : esNovela(post) ? escenasNovela(post)[0].imagen : undefined;
}

// Nombre de la serie (si no hay, el webcomic cuenta como one-shot con su propio título)
export function serieNombre(post) {
  return post.data.comic?.serie ?? post.data.titulo;
}

// Agrupa los webcomics por serie. Cada serie: { slug, nombre, capitulos[], portada, ultimo }
export function seriesDe(posts) {
  const mapa = new Map();
  for (const p of posts.filter(esComic)) {
    const nombre = serieNombre(p);
    const slug = slugify(nombre);
    const serie = mapa.get(slug) ?? { slug, nombre, capitulos: [] };
    serie.capitulos.push(p);
    mapa.set(slug, serie);
  }
  return [...mapa.values()]
    .map((s) => {
      s.capitulos.sort(
        (a, b) =>
          (a.data.comic.capitulo ?? 0) - (b.data.comic.capitulo ?? 0) ||
          a.data.fecha.valueOf() - b.data.fecha.valueOf(),
      );
      s.portada = portadaDe(s.capitulos[0]);
      s.ultimo = s.capitulos[s.capitulos.length - 1];
      return s;
    })
    .sort((a, b) => b.ultimo.data.fecha.valueOf() - a.ultimo.data.fecha.valueOf());
}

export function categoriaInfo(clave) {
  return {
    nombre: clave,
    emoji: '📝',
    color: 'amarillo',
    descripcion: '',
    ...(sitio.categorias[clave] ?? {}),
    clave,
  };
}

export function contarCategorias(posts) {
  const conteo = {};
  for (const p of posts) conteo[p.data.categoria] = (conteo[p.data.categoria] ?? 0) + 1;
  return Object.entries(conteo)
    .map(([clave, total]) => ({ ...categoriaInfo(clave), total }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}

export function contarEtiquetas(posts) {
  const mapa = new Map();
  for (const p of posts) {
    for (const nombre of p.data.etiquetas) {
      const slug = slugify(nombre);
      const actual = mapa.get(slug) ?? { slug, nombre, total: 0 };
      actual.total += 1;
      mapa.set(slug, actual);
    }
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}

// Genera las variables CSS (colores y fuentes) a partir de sitio.js
export function cssTema() {
  const { claro, oscuro, acentos } = sitio.tema;
  const f = sitio.fuentes;
  const mapa = {
    fondo: 'bg',
    rejilla: 'grid',
    texto: 'ink',
    suave: 'muted',
    borde: 'line',
    tarjeta: 'card',
    panel: 'panel',
    textoPanel: 'panel-ink',
    cinta: 'tape',
  };
  const bloque = (obj) =>
    Object.entries(mapa)
      .map(([k, v]) => (obj[k] ? `--${v}:${obj[k]};` : ''))
      .join('');
  const colores = Object.entries(acentos)
    .map(([k, v]) => `--c-${k}:${v};`)
    .join('');
  return (
    `:root{${colores}${bloque(claro)}` +
    `--font-main:${f.principal};--font-hand:${f.manuscrita};--font-pixel:${f.pixel};--font-mono:${f.mono};}` +
    `[data-theme="dark"]{${bloque(oscuro)}}`
  );
}
