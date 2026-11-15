import rss from '@astrojs/rss';
import { sitio } from '../../sitio.js';
import { getPosts, urlPost } from '../lib/utils.js';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: sitio.nombre,
    description: sitio.descripcion,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.titulo,
      description: p.data.descripcion,
      pubDate: p.data.fecha,
      link: urlPost(p),
    })),
    customData: `<language>${sitio.idioma}</language>`,
  });
}
