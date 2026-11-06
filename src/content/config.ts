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

// ===== NOVELA GRÁFICA ANIMADA (tipo: novela) =====
const textoNovela = z.object({
  tipo: z.enum(['voz', 'globo', 'cuadro']).default('voz'), // voz = subtítulo de cinemática | globo = burbuja | cuadro = recuadro de narración
  quien: z.string().optional(), // quién habla (sale encima del texto)
  texto: z.string(),
  pos: z.enum(['arriba', 'centro', 'abajo', 'arriba-izq', 'arriba-der', 'abajo-izq', 'abajo-der']).optional(),
  si: z.enum(['exito', 'fallo']).optional(), // mostrar solo si el quicktime event salió bien o mal
});
const qte = z.object({
  tecla: z.string().default('espacio'), // espacio | una letra (x, z...)
  etiqueta: z.string().optional(), // lo que dice el botón (por defecto, la tecla)
  texto: z.string().optional(), // mensaje, ej: ¡Esquiva!
  tiempo: z.number().default(2.5), // segundos para reaccionar
  obligatorio: z.boolean().default(false), // true = si fallas, se repite
});
const plano = z.object({
  panel: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [x, y, ancho, alto] en % de la imagen: la cámara encuadra ese recuadro
  foco: z.object({ x: z.number(), y: z.number(), zoom: z.number().default(1) }).optional(), // alternativa: centro (x, y en %) y zoom
  duracion: z.number().default(1), // cuánto scroll dura el plano (en pantallas)
  efecto: z.enum(['temblor', 'destello', 'rojo']).optional(),
  textos: z.array(textoNovela).default([]),
  qte: qte.optional(),
});
const capaNovela = z.object({ imagen: z.string(), profundidad: z.number().default(0.3) }); // capa PNG con el mismo lienzo; 0 = fondo, 1 = muy cerca
const escena = z.object({
  imagen: z.string(),
  alt: z.string().optional(),
  fondo: z.string().default('#000'),
  entrada: z.enum(['negro', 'blanco', 'corte']).default('negro'),
  salida: z.enum(['negro', 'blanco', 'corte']).default('negro'),
  barras: z.boolean().default(true), // barras negras de cine arriba y abajo
  capas: z.array(capaNovela).default([]),
  planos: z.array(plano).min(1),
});
const novela = z.object({ escenas: z.array(escena).default([]) });

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
    noListado: z.boolean().default(false), // true = existe y se abre con su enlace, pero no sale en listas, búsqueda, RSS ni recomendaciones
    tipo: z.enum(['articulo', 'webcomic', 'novela']).default('articulo'),
    comic: comic.optional(),
    novela: novela.optional(),
  }),
});

export const collections = { posts };
