---
titulo: 'El primer panel'
descripcion: 'Capítulo de ejemplo.'
fecha: 2026-11-01
categoria: webcomics
etiquetas: ['demo']
tipo: webcomic
portada: '/img/portada.webp'
comic:
  serie: 'Cuaderno de Pruebas'   # agrupa los capítulos; si lo quitas, es un one-shot
  capitulo: 1                    # número, ordena la serie
  modo: vertical                 # vertical = webtoon | paginado = una página a la vez
  direccion: ltr                 # ltr = occidental | rtl = manga
  paginas:
    - /comic/cap1-01.webp                 # forma corta: solo la ruta
    - imagen: /comic/cap1-02.webp         # forma larga: con alt y nota
      alt: 'Dos viñetas y una burbuja'
      nota: 'Texto que aparece debajo de esta página'
---

Notas del autor (opcional).