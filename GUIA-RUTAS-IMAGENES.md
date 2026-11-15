# Cómo insertar imágenes y álbumes

## Imágenes normales

Las imágenes administradas desde el panel se guardan en `src/assets/img/` y se mantienen también en `public/img/` para que funcionen dentro de Markdown y HTML.

Usa siempre la ruta corta:

```md
![Mi avatar](/img/avatar.webp)
```

También funciona en HTML dentro de un artículo:

```html
<img src="/img/avatar.webp" alt="Mi avatar" width="300">
```

No escribas `/src/assets/img/avatar.webp` ni rutas relativas como `../../assets/img/avatar.webp`.

## Imágenes que están en public

La ruta web comienza después de `public/`. Por ejemplo:

- Archivo: `public/comic-demo/pagina-1.svg`
- URL: `/comic-demo/pagina-1.svg`

## Fotos de la galería

La foto grande de este álbum se referencia así:

```md
![Modelo 2](/galeria/modelos-album-de-prueba/modelo-2-g.webp)
```

La miniatura termina en `-m.webp`; la imagen grande termina en `-g.webp`.

## Insertar una tarjeta de álbum

Pon el enlace solo en su propio párrafo:

```md
[album](/galeria/modelos-album-de-prueba/)
```

El plugin lo convierte en una tarjeta con portada, nombre y cantidad de fotos.

## Insertar una foto de la galería con enlace al visor

Pon el enlace solo en su propio párrafo y usa el ID de la foto que aparece en `album.json`:

```md
[foto](/galeria/modelos-album-de-prueba/#modelo-2)
```

El plugin genera la imagen grande, su título y el enlace a la foto dentro del visor de la galería.

## Enlaces normales

Si quieres que el usuario vaya al álbum sin insertar una tarjeta, escribe el enlace dentro de una frase:

```md
Puedes ver el [álbum de modelos](/galeria/modelos-album-de-prueba/) completo.
```
