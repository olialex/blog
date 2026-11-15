---
titulo: 'El primer panel'
descripcion: 'Capítulo de ejemplo en modo vertical (webtoon): las páginas se leen de corrido, una debajo de otra.'
fecha: 2026-11-01
categoria: webcomics
etiquetas: ['demo', 'webcomic']
tipo: webcomic
portada: '/comic-demo/portada.svg'
comic:
  serie: 'Cuaderno de Pruebas'
  capitulo: 1
  modo: vertical # vertical = webtoon | paginado = una página a la vez
  direccion: ltr # ltr = occidental | rtl = manga (de derecha a izquierda)
  paginas:
    - /comic-demo/pagina-1.svg
    - imagen: /comic-demo/pagina-2.svg
      alt: 'Dos viñetas pequeñas y una burbuja que dice ¡Hola!'
      nota: 'Una nota opcional que aparece debajo de esta página.'
    - /comic-demo/pagina-3.svg
---

Este texto es opcional: aparece debajo del lector, ideal para **notas del autor**.

Si no quieres notas, deja el cuerpo vacío y solo se mostrará el cómic.
