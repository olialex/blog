// Plugin Remark para insertar álbumes/fotos de public/galeria en artículos Markdown.
// Sintaxis admitida:
//   [album](/galeria/modelos-album-de-prueba/)
//   [foto](/galeria/modelos-album-de-prueba/#modelo-2)
// También normaliza imágenes antiguas escritas como /src/assets/img/foto.webp
// o ../../assets/img/foto.webp a la URL pública estable /img/foto.webp.
import { sitio } from '../../sitio.js';
import { leerAlbumFs } from './galeria-fs.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const html = (value) => ({ type: 'html', value });

function normalizarImagen(url) {
  if (typeof url !== 'string') return url;
  // Ruta histórica usada incorrectamente en algunos artículos.
  let limpia = url.replace(/^\.\.\/+(?:\.\.\/)*assets\/img\//, '/img/');
  limpia = limpia.replace(/^\/?src\/assets\/img\//, '/img/');
  return limpia;
}

export default function remarkGaleria() {
  const base = String(sitio.base || '').replace(/\/$/, '');
  const urlBase = String(sitio.galeria?.urlBase || '/galeria').replace(/\/$/, '') || '/galeria';
  const urlBaseSinBase = urlBase.startsWith('/') ? urlBase : `/${urlBase}`;
  const prefijo = `${base}${urlBaseSinBase}`;

  const crear = (href) => {
    if (typeof href !== 'string') return null;
    let pathname = href.split(/[?#]/, 1)[0];
    let hash = '';
    const hashIndex = href.indexOf('#');
    if (hashIndex >= 0) hash = href.slice(hashIndex + 1).split('?')[0];
    try {
      if (/^https?:\/\//i.test(pathname)) pathname = new URL(pathname).pathname;
    } catch { return null; }

    // Acepta /galeria/... y también la URL configurada en sitio.js.
    const candidatos = [...new Set([urlBaseSinBase, '/galeria'])];
    let ruta = null;
    for (const candidato of candidatos) {
      const limpio = pathname.replace(/\/$/, '');
      if (limpio.startsWith(`${candidato}/`)) {
        ruta = limpio.slice(candidato.length + 1);
        break;
      }
    }
    if (!ruta) return null;
    ruta = decodeURIComponent(ruta).replace(/^\/+|\/+$/g, '');
    if (!ruta || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(ruta)) return null;

    const album = leerAlbumFs(ruta);
    if (!album) return null;
    const fotos = Array.isArray(album.fotos) ? album.fotos : [];
    const enlace = `${prefijo}/${ruta}/`;

    if (hash) {
      const id = decodeURIComponent(hash);
      const foto = fotos.find((f) => f.id === id);
      if (!foto) return null;
      const titulo = escapeHtml(foto.titulo || 'Sin título');
      const src = `${prefijo}/${ruta}/${encodeURIComponent(foto.id)}-g.webp`;
      return html(`<figure class="gal-embed gal-embed-foto"><a href="${enlace}#${encodeURIComponent(foto.id)}"><img src="${src}" alt="${titulo}" loading="lazy" decoding="async"${foto.w ? ` width="${Number(foto.w)}"` : ''}${foto.h ? ` height="${Number(foto.h)}"` : ''}></a><figcaption><span class="gal-embed-titulo">${titulo}</span><a href="${enlace}#${encodeURIComponent(foto.id)}">Ver en la galería</a></figcaption></figure>`);
    }

    const portada = fotos.find((f) => f.id === album.portada) || fotos[0];
    const cantidad = fotos.length;
    const imagen = portada
      ? `<img src="${prefijo}/${ruta}/${encodeURIComponent(portada.id)}-m.webp" alt="" loading="lazy" decoding="async">`
      : '<span class="gal-embed-vacio"></span>';
    const titulo = escapeHtml(album.titulo || ruta);
    return html(`<a class="gal-embed gal-embed-album" href="${enlace}">${imagen}<span class="gal-embed-info"><strong>${titulo}</strong><small>Álbum · ${cantidad} ${cantidad === 1 ? 'foto' : 'fotos'}</small></span></a>`);
  };

  return (tree) => {
    const recorrer = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      node.children = node.children.map((child) => {
        if (child.type === 'image') child.url = normalizarImagen(child.url);

        // El HTML escrito a mano en Markdown no pasa por el nodo image de Remark.
        if (child.type === 'html' && typeof child.value === 'string') {
          child.value = child.value.replace(/(\bsrc\s*=\s*)(["'])([^"']+)\2/gi, (_m, inicio, comilla, url) => `${inicio}${comilla}${normalizarImagen(url)}${comilla}`);
        }

        if (child.type === 'paragraph') {
          const utiles = child.children?.filter((c) => !(c.type === 'text' && !c.value.trim())) ?? [];
          if (utiles.length === 1 && utiles[0].type === 'link') {
            const insertado = crear(utiles[0].url);
            if (insertado) return insertado;
          }
        }
        recorrer(child);
        return child;
      });
    };
    recorrer(tree);
  };
}
