import { getCollection } from 'astro:content';
import { sitio } from '../../sitio.js';

// Todos los artículos, del más nuevo al más viejo (los borradores solo se ven en desarrollo)
// Todos los posts publicados, incluidos los "no listados" (solo lo usa la página de cada artículo)
export async function getTodos() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.borrador);
  return posts.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

// Los posts que sí salen en listas, buscador, RSS y recomendaciones (sin los "no listados")
export async function getPosts() {
  return (await getTodos()).filter((p) => !p.data.noListado);
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

// Una novela gráfica animada tiene tipo: novela y una lista novela.escenas
export function esNovela(post) {
  return post.data.tipo === 'novela' && Boolean(post.data.novela?.escenas?.length);
}
export function escenasNovela(post) {
  return post.data.novela.escenas.map((e) => ({
    ...e,
    imagen: e.imagen,
    capas: e.capas.map((c) => ({ ...c })),
  }));
}

// Convierte cada página (texto u objeto) a { imagen, alt, nota }
export function paginasComic(post) {
  return (post.data.comic?.paginas ?? []).map((p) =>
    typeof p === 'string'
      ? { imagen: p, alt: '', nota: '' }
      : { imagen: p.imagen, alt: p.alt ?? '', nota: p.nota ?? '' },
  );
}

// Imagen de portada: la del artículo o, si es webcomic, su primera página
export function portadaDe(post) {
  return post.data.portada ? post.data.portada : esComic(post) ? paginasComic(post)[0]?.imagen : esNovela(post) ? escenasNovela(post)[0].imagen : undefined;
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
  // La lista de categorías es la de sitio.categorias (aunque no tengan artículos todavía).
  // Un artículo con una categoría que ya no existe sigue visible, pero esa categoría no sale en las listas.
  const conteo = Object.fromEntries(Object.keys(sitio.categorias).map((k) => [k, 0]));
  for (const p of posts) if (p.data.categoria in conteo) conteo[p.data.categoria] += 1;
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
  // Color del texto que va SOBRE cada acento: el que pones en tema.textoAcento o, si no, negro/blanco automático
  const sobre = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return '#121212';
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl > 0.18 ? '#121212' : '#ffffff';
  };
  const textos = Object.entries(acentos)
    .map(([k, v]) => `--t-${k}:${sitio.tema.textoAcento?.[k] || sobre(v)};`)
    .join('');
  // Colores de elementos sueltos (tema.elementos): nombre de acento o color propio
  const elementos = Object.entries(sitio.tema.elementos ?? {})
    .filter(([k, v]) => /^[a-zA-Z]+$/.test(k) && /^(#[0-9a-f]{6}|[a-z0-9-]+)$/i.test(String(v)))
    .map(([k, v]) => `--el-${k}:${v.startsWith('#') ? v : `var(--c-${v})`};`)
    .join('');
  // Los elementos con style="--acento:var(--c-X)" reciben también --acento-t
  const reglas = Object.keys(acentos)
    .map((k) => `[style*="--acento:var(--c-${k})"]{--acento-t:var(--t-${k});}`)
    .join('');
  // Estilo general: opacidad de bordes, sombras y esquinas (tema.estilo, se edita en el panel → Colores)
  const e = { esquinas: 'redondeadas', bordeOpacidad: 8, bordeHover: 20, sombras: true, ...(sitio.tema.estilo ?? {}) };
  const pct = (n, def) => `${Number.isFinite(Number(n)) ? Math.min(100, Math.max(0, Number(n))) : def}%`;
  const radios = e.esquinas === 'duras'
    ? '--r-xs:0;--r-sm:2px;--r-md:3px;--r-lg:4px;--r-pill:3px;'
    : '--r-xs:6px;--r-sm:10px;--r-md:14px;--r-lg:20px;--r-pill:999px;';
  const conSombra = e.sombras !== false;
  const estilo =
    `--borde-pct:${pct(e.bordeOpacidad, 8)};--borde-h-pct:${pct(e.bordeHover, 20)};${radios}` +
    (conSombra
      ? '--sombra:0 1px 2px rgba(0,0,0,.04),0 10px 28px -12px rgba(0,0,0,.16);--sombra-h:0 2px 4px rgba(0,0,0,.05),0 18px 36px -14px rgba(0,0,0,.26);'
      : '--sombra:none;--sombra-h:none;');
  const estiloOscuro = conSombra
    ? '--sombra:0 1px 2px rgba(0,0,0,.3),0 12px 30px -12px rgba(0,0,0,.6);--sombra-h:0 2px 4px rgba(0,0,0,.35),0 20px 38px -14px rgba(0,0,0,.7);'
    : '';
  return (
    `:root{${colores}${textos}${elementos}${bloque(claro)}${estilo}` +
    `--font-main:${f.principal};--font-hand:${f.manuscrita};--font-pixel:${f.pixel};--font-mono:${f.mono};}` +
    `[data-theme="dark"]{${bloque(oscuro)}${estiloOscuro}}` +
    reglas
  );
}
