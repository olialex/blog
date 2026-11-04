import { defineCollection, z } from 'astro:content';

// Una página de webcomic puede ser solo la ruta de la imagen,
// o un objeto con { imagen, alt, nota } si quieres añadir texto.
const paginaComic = z.union([
  z.string(),
  z.object({
    imagen: z.string(),
    alt: z.string().optional(),
    nota: z.string().optional(),
  }),
]);

// Bloque "comic": solo se usa cuando tipo: webcomic
const comic = z.object({
  serie: z.string().optional(), // nombre de la serie (agrupa capítulos). Si falta, es un one-shot
  capitulo: z.number().optional(), // número del capítulo (ordena la serie)
  modo: z.enum(['vertical', 'paginado']).default('vertical'), // vertical = webtoon, paginado = una página a la vez
  direccion: z.enum(['ltr', 'rtl']).default('ltr'), // ltr = occidental, rtl = manga
  paginas: z.array(paginaComic).default([]),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    actualizado: z.coerce.date().optional(),
    categoria: z.string(),
    etiquetas: z.array(z.string()).default([]),
    portada: z.string().optional(),
    portadaAlt: z.string().optional(),
    destacado: z.boolean().default(false),
    borrador: z.boolean().default(false),
    tipo: z.enum(['articulo', 'webcomic']).default('articulo'),
    comic: comic.optional(),
  }),
});

export const collections = { posts };
