// Plugin de Markdown: en un artículo, un enlace a la galería puesto SOLO en su propio párrafo se convierte en:
//   /galeria/mi-album/            → una tarjeta del álbum (portada, título y cantidad de fotos)
//   /galeria/mi-album/#id-foto    → la foto con leyenda y enlace al visor
// (El enlace lo copias desde el panel → Galería.) Funciona en .md y .mdx.
import { sitio } from '../../sitio.js';
import { leerAlbumFs } from './galeria-fs.js';

const nodo = (tag, props, children = []) => ({ type: 'paragraph', data: { hName: tag, hProperties: props }, children });
const texto = (value) => ({ type: 'text', value });
const imagen = (url, alt, props) => ({ type: 'image', url, alt, data: { hProperties: props } });

export default function remarkGaleria() {
  const base = String(sitio.base || '').replace(/\/$/, '');
  const urlBase = String(sitio.galeria?.urlBase || '/galeria').replace(/\/$/, '');

  const crear = (href) => {
    const m = /(?:^|[/])galeria\/([a-z0-9][a-z0-9/-]*?)\/?(?:#([^#\s]+))?$/.exec(href.split('?')[0].replace(/^https?:\/\/[^/]+/, ''));
    if (!m) return null;
    const ruta = m[1], id = m[2] ? decodeURIComponent(m[2]) : '';
    const a = leerAlbumFs(ruta);
    if (!a) return null;
    const fotos = a.fotos ?? [];
    const enlace = `${base}/galeria/${ruta}/`;

    if (id) {
      const f = fotos.find((x) => x.id === id);
      if (!f) return null;
      const pie = [nodo('span', { className: ['gal-embed-titulo'] }, [texto(f.titulo || 'Sin título')])];
      pie.push(nodo('a', { href: `${enlace}#${f.id}` }, [texto('Ver en la galería')]));
      return nodo('figure', { className: ['gal-embed', 'gal-embed-foto'] }, [
        nodo('a', { href: `${enlace}#${f.id}` }, [imagen(`${base}${urlBase}/${ruta}/${f.id}-g.webp`, f.titulo || '', { loading: 'lazy', decoding: 'async', width: f.w, height: f.h })]),
        nodo('figcaption', {}, pie),
      ]);
    }
    const portada = fotos.find((x) => x.id === a.portada) ?? fotos[0];
    const n = fotos.length;
    return nodo('a', { className: ['gal-embed', 'gal-embed-album'], href: enlace }, [
      portada ? imagen(`${base}${urlBase}/${ruta}/${portada.id}-m.webp`, '', { loading: 'lazy', decoding: 'async' }) : nodo('span', { className: ['gal-embed-vacio'] }, []),
      nodo('span', { className: ['gal-embed-info'] }, [
        nodo('strong', {}, [texto(a.titulo || ruta)]),
        nodo('small', {}, [texto(`Álbum · ${n} ${n === 1 ? 'foto' : 'fotos'}`)]),
      ]),
    ]);
  };

  const recorrer = (padre) => {
    if (!padre.children) return;
    padre.children = padre.children.map((h) => {
      if (h.type === 'paragraph') {
        const util = h.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
        if (util.length === 1 && util[0].type === 'link') return crear(util[0].url) ?? h;
      }
      recorrer(h);
      return h;
    });
  };
  return (arbol) => recorrer(arbol);
}
