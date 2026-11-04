import { getPosts, urlPost, categoriaInfo, formatoFecha, portadaDe, esComic } from '../lib/utils.js';

// Índice que usa el Explorador de artículos (se genera al compilar)
export async function GET() {
  const posts = await getPosts();
  const indice = posts.map((p) => {
    const cat = categoriaInfo(p.data.categoria);
    return {
      t: p.data.titulo,
      d: p.data.descripcion,
      u: urlPost(p),
      c: cat.clave,
      cn: cat.nombre,
      ce: cat.emoji,
      e: p.data.etiquetas,
      i: portadaDe(p) ?? '',
      f: formatoFecha(p.data.fecha),
      x: esComic(p),
    };
  });
  return new Response(JSON.stringify(indice), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
