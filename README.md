# Mi Cuaderno Digital — Blog en Astro

Blog completo: inicio, listado con paginación, artículo individual (3 columnas), temas, etiquetas, **webcomics**, sobre mí, buscador, RSS, sitemap y modo oscuro.
**Todo el sitio se edita desde un solo archivo: `sitio.js`.**

## Cómo usarlo (pnpm)

```bash
pnpm install
pnpm dev        # ver el blog en http://localhost:4321
pnpm build      # genera dist/ listo para publicar
pnpm preview    # probar el build
```

## Qué se edita y dónde

| Quiero cambiar...                                   | Archivo                      |
| --------------------------------------------------- | ---------------------------- |
| Nombre, textos, menú, colores, fuentes, widgets     | `sitio.js`                   |
| Mis artículos y webcomics                           | `src/content/posts/*.md`     |
| Fotos y páginas de cómic propias                    | `public/` (ruta `/mi-foto.jpg`) |
| Íconos SVG disponibles                              | `src/lib/iconos.js`          |

## Escribir un artículo

Crea `src/content/posts/mi-articulo.md` (o `.mdx`):

```md
---
titulo: 'Título del artículo'
descripcion: 'Resumen corto.'
fecha: 2026-11-03
categoria: ideas            # debe existir en sitio.js → categorias
etiquetas: ['una', 'otra']
portada: 'https://...'      # o '/mi-foto.jpg' si está en public/
destacado: false            # true = sale grande en la portada
borrador: false             # true = no se publica
---

Texto en Markdown. Usa ## y ### para títulos: arman el índice de la izquierda.
```

El nombre del archivo es la dirección: `mi-articulo.md` → `/articulo/mi-articulo/`.

## Publicar un WEBCOMIC

Es el mismo tipo de archivo, con dos añadidos en el frontmatter: `tipo: webcomic` y el bloque `comic`.

```md
---
titulo: 'El primer panel'
descripcion: 'Resumen del capítulo.'
fecha: 2026-11-01
categoria: webcomics
tipo: webcomic
portada: '/comic/portada.jpg'   # opcional: si no la pones, se usa la primera página
comic:
  serie: 'Nombre de la serie'   # agrupa los capítulos. Si la quitas, es un one-shot
  capitulo: 1                   # número; ordena los capítulos
  modo: vertical                # vertical = webtoon | paginado = una página a la vez
  direccion: ltr                # ltr = occidental | rtl = manga (derecha a izquierda)
  paginas:
    - /comic/cap1/01.jpg        # forma corta: solo la ruta
    - imagen: /comic/cap1/02.jpg  # forma larga: con descripción y nota
      alt: 'Descripción de la imagen (accesibilidad)'
      nota: 'Texto que aparece debajo de esta página'
    - /comic/cap1/03.jpg
---

Texto opcional: aparece debajo del lector (notas del autor).
```

- Guarda las imágenes en `public/` (por ejemplo `public/comic/cap1/01.jpg`).
- **Vertical:** páginas pegadas, de corrido.
- **Paginado:** una página a la vez. Se avanza con los botones, las flechas ← → del teclado o haciendo clic en la mitad de la imagen. Con `direccion: rtl` se invierte (manga).
- Cada serie tiene su página en `/webcomics/nombre-de-la-serie/` con la lista de capítulos, y el lector trae navegación al capítulo anterior y siguiente.
- Hay dos capítulos de ejemplo en `src/content/posts/capitulo-*.md` (las imágenes son de relleno en `public/comic-demo/`). Bórralos cuando tengas los tuyos.
- Si no harás webcomics: quita "Webcomics" de `navegacion` en `sitio.js` y `home.mostrarWebcomics: false`.

## Página de artículo (3 columnas)

- **Centro:** el texto, centrado.
- **Izquierda:** índice fijo (sticky) que resalta el apartado que lees. En un webcomic muestra la lista de capítulos. Se activa con `articulo.mostrarIndice`.
- **Derecha:** información extra discreta. Se configura en `sitio.js → articulo.barraDerecha`:
  `['meta', 'autor', 'etiquetas', 'compartir']` (también: `recientes`, `categorias`, `newsletter`).
- En pantallas pequeñas todo pasa a una sola columna.

## Explorador de artículos

- **Popup:** el botón de la lupa del header (o la tecla `/`) abre una ventana con buscador, filtro por tema y la lista de artículos, que va cargando más al hacer scroll. Se mueve con las flechas ↑ ↓, Enter abre el primero y Esc cierra.
- **Filtro en `/articulos/`:** el buscador y los chips de temas filtran las tarjetas en vivo y guardan la búsqueda en la dirección (por ejemplo `/articulos/?q=comic&tema=webcomics`). Se muestran `listado.porPagina` tarjetas y un botón "Mostrar más" revela el resto.
- Los textos se editan en `sitio.js → textos` (las claves que empiezan con `explorar`). Los estilos están en `src/styles/explorador.css`.

## La clase de opacidad (`hover-opacidad`)

Está en su propio archivo: `src/styles/hover.css`. Apaga un poco el header y las barras laterales y las aclara al pasar el mouse.

- Quitarla de un elemento: borra la palabra `hover-opacidad` de su `class="..."`.
- Quitarla de todo el sitio: borra la línea `import '../styles/hover.css'` en `src/layouts/Base.astro`.
- Cambiar la intensidad: el valor `.55` dentro de `hover.css`.

## Íconos SVG

Los botones usan íconos SVG (no emojis). Se ponen en `sitio.js` con `icono: '...'` (menú, botón de suscribir, redes, botón del hero). Los nombres disponibles están en `src/lib/iconos.js`; para agregar uno nuevo, añade una línea ahí. En un archivo `.astro` se usan así: `<Icono nombre="correo" tamano={16} />`.

## Antes de publicar

1. Cambia `url` en `sitio.js` por tu dirección real (la usan el sitemap, el RSS y las vistas previas).
2. Cambia tus datos en `autor` y `sobreMi`.
3. **Newsletter:** pon en `newsletter.accion` la URL de un servicio de formularios (por ejemplo Formspree). Si la dejas vacía, solo funciona en modo demostración y **no guarda correos**.
4. **Comentarios (opcional):** en `articulo.comentarios` pon `activo: true` y los datos de [giscus.app](https://giscus.app).

Es un sitio estático: sube `dist/` a Cloudflare Pages, Netlify, Vercel o GitHub Pages.

## Estructura

```
sitio.js                  ← TODO el contenido y la configuración
src/content/posts/        ← artículos y webcomics (.md / .mdx)
src/pages/                ← inicio, /articulos/, /articulo/[slug], /webcomics/, /categorias/, /etiquetas/, /sobre-mi/, 404, rss, buscador
src/components/           ← navbar, footer, tarjetas, lector de cómic, íconos...
src/components/widgets/   ← sobre mí, categorías, recientes, etiquetas, newsletter, info del artículo
src/lib/iconos.js         ← íconos SVG
src/styles/               ← global.css, header.css, cards.css, sidebar.css, single.css, comic.css, explorador.css, hover.css, iconos.css
```

## Publicar en GitHub Pages (en una carpeta, no en la raíz)

Si la dirección es `https://usuario.github.io/nombre-del-repo`, en `sitio.js` pon `url` con esa dirección completa y `base: '/nombre-del-repo'` (el mismo nombre que tiene el repositorio). Los enlaces internos pasan por la función `ruta()` de `src/lib/utils.js`, que agrega la base. En `sitio.js` y en tus textos escribe los enlaces internos normales (`/articulos/`) y no hay que agregar la base a mano.
