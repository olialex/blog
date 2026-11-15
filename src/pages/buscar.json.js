import { urlImagen } from '../lib/imagenes.js';
import { getPosts, urlPost, categoriaInfo, formatoFecha, portadaDe, esComic } from '../lib/utils.js';

// Índice que usa el Explorador de artículos (se genera al compilar)
export async function GET() {
  const posts = await getPosts();
  const indice = await Promise.all(
    posts.map(async (p) => {
      const cat = categoriaInfo(p.data.categoria);
      return {
        t: p.data.titulo,
        d: p.data.descripcion,
        u: urlPost(p),
        c: cat.clave,
        cn: cat.nombre,
        ce: cat.emoji,
        e: p.data.etiquetas,
        i: (await urlImagen(portadaDe(p), 400)) ?? '',
        f: formatoFecha(p.data.fecha),
        x: esComic(p),
      };
    })
  );

  return new Response(JSON.stringify(indice), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}