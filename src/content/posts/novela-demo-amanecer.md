---
titulo: 'Amanecer en la frontera'
descripcion: 'Novela gráfica animada de ejemplo: la cámara viaja por las viñetas al hacer scroll, con textos estilo cinemática y un quicktime event.'
fecha: 2026-11-04
categoria: webcomics
etiquetas: ['demo', 'novela gráfica']
tipo: novela
portada: '/novela-demo/pagina.svg'
novela:
  escenas:
    # ---------------- ESCENA 1: una página de cómic recorrida por planos ----------------
    - imagen: /novela-demo/pagina.svg
      alt: 'Página de cómic con cuatro viñetas: una ciudad de noche, un soldado, una radio y una explosión.'
      entrada: negro            # negro | blanco | corte
      salida: negro
      capas:                    # opcional: capas PNG/SVG del mismo tamaño, se mueven con parallax
        - { imagen: /novela-demo/capa-frente.svg, profundidad: 0.5 }
      planos:
        - panel: [0, 0, 100, 28]        # [x, y, ancho, alto] en % de la imagen: la cámara encuadra ese recuadro
          duracion: 1.6                 # pantallas de scroll que dura este plano
          textos:
            - { tipo: cuadro, texto: 'Frontera norte. 03:12 a.m.' }
            - { tipo: voz, quien: 'Narrador', texto: 'La ciudad dormía, pero alguien ya estaba despierto.' }
        - panel: [0, 30, 55, 34]
          duracion: 1.4
          textos:
            - { tipo: voz, quien: 'Mara', texto: 'Silencio. Demasiado silencio.' }
        - panel: [57, 30, 43, 34]
          duracion: 1.8
          efecto: destello
          textos:
            - { tipo: globo, quien: 'Radio', texto: '¡Mara! ¡Contacto enemigo, sal de ahí!', pos: arriba-der }
            - { tipo: voz, quien: 'Mara', texto: '¡Los vi! ¡Me muevo!', si: exito }
            - { tipo: voz, quien: 'Mara', texto: 'Me tomaron por sorpresa…', si: fallo }
          qte:
            tecla: espacio
            etiqueta: ESPACIO
            texto: '¡Esquiva!'
            tiempo: 2.5
            obligatorio: false
        - panel: [0, 66, 100, 34]
          duracion: 1.6
          efecto: temblor
          textos:
            - { tipo: voz, texto: '¡BOOM!', pos: centro }
    # ---------------- ESCENA 2: una imagen ancha con foco y zoom ----------------
    - imagen: /novela-demo/escena-2.svg
      alt: 'Un amanecer naranja detrás de las montañas.'
      entrada: negro
      salida: blanco
      planos:
        - foco: { x: 50, y: 50, zoom: 1 }
          duracion: 1.2
          textos:
            - { tipo: cuadro, texto: 'Horas después…', pos: arriba-izq }
        - foco: { x: 72, y: 62, zoom: 1.7 }
          duracion: 1.6
          textos:
            - { tipo: voz, quien: 'Mara', texto: 'Un día más. Y seguimos de pie.' }
---

Estas son las **notas del autor**: aparecen debajo de la novela. Si no las quieres, deja el cuerpo vacío.
