---
titulo: 'El primer panel'
descripcion: 'Capítulo de ejemplo.'
fecha: 2026-11-01
categoria: webcomics
etiquetas: ['demo']
portada: '/img/portada.webp'
tipo: novela
novela:
  escenas:
    - imagen: /novela/pagina1.webp
      alt: 'Descripción de la imagen'
      fondo: '#000'               # color de fondo (opcional)
      entrada: negro              # negro | blanco | corte
      salida: negro
      barras: true                # barras de cine arriba y abajo
      capas:                      # opcional: PNG del mismo tamaño con efecto parallax
        - { imagen: /novela/frente.png, profundidad: 0.5 }
      planos:                     # mínimo 1 plano por escena
        - panel: [0, 0, 100, 28]  # [x, y, ancho, alto] en % de la imagen
          duracion: 1.6           # pantallas de scroll que dura
          efecto: destello        # opcional: temblor | destello | rojo
          textos:
            - { tipo: cuadro, texto: 'Frontera norte. 03:12 a.m.' }
            - { tipo: voz, quien: 'Mara', texto: 'Silencio.' }
        - foco: { x: 72, y: 62, zoom: 1.7 }   # alternativa a "panel": centro y zoom
          duracion: 1.4
          textos:
            - { tipo: globo, quien: 'Radio', texto: '¡Contacto!', pos: arriba-der }
            - { tipo: voz, texto: '¡Los vi!', si: exito }
          qte:                    # evento de reacción (opcional)
            tecla: espacio
            etiqueta: ESPACIO
            texto: '¡Esquiva!'
            tiempo: 2.5
            obligatorio: false
---
