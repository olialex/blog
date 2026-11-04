// ============================================================================
//  sitio.js  —  AQUÍ SE EDITA TODO EL SITIO
//  Nombre, textos, menú, colores, fuentes, categorías, widgets, newsletter...
//  Los artículos se escriben aparte, en src/content/posts/*.md
// ============================================================================

export const sitio = {
  // --------------------------------------------------------------------------
  // 1. DATOS GENERALES
  // --------------------------------------------------------------------------
  url: 'https://olialex.github.io/blog', // La dirección final completa de tu blog (sin / al final)
  base: '/blog', // Solo la carpeta del final de la dirección (igual al nombre del repositorio). En un dominio propio déjalo ''
  idioma: 'es', // es, en, pt...
  nombre: 'Mi Cuaderno Digital',
  eslogan: 'mi cuaderno digital', // texto pequeño manuscrito sobre el título
  descripcion:
    'Un rincón tranquilo de internet donde escribo sobre ideas, aprendizaje, proyectos y vida diaria.',
  imagenCompartir: '', // imagen por defecto al compartir (URL completa). Opcional.

  // --------------------------------------------------------------------------
  // 2. AUTOR (aparece en el hero, el widget "sobre mí" y al final de cada artículo)
  // --------------------------------------------------------------------------
  autor: {
    nombre: 'Tu Nombre',
    rol: 'Escritor y curioso de tiempo completo',
    ubicacion: 'Tu ciudad',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Escribo sobre lo que aprendo, lo que construyo y lo que me hace pensar. Este blog es mi cuaderno abierto.',
    redes: [
      { nombre: '', icono: 'instagram', url: 'https://instagram.com/' },
      { nombre: '', icono: 'youtube', url: 'https://youtube.com/' },
      { nombre: '', icono: 'x', url: 'https://x.com/' },
      { nombre: '', icono: 'correo', url: 'mailto:hola@tu-blog.com' },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. MENÚ
  // --------------------------------------------------------------------------
  // Cada enlace puede llevar un ícono SVG (icono: '...'). Nombres disponibles en src/lib/iconos.js:
  // inicio, lapiz, libro, pelicula, usuario, correo, buscar, enlace, lista, rss,
  // instagram, youtube, x, facebook, whatsapp, github, flecha-abajo, flecha-izquierda, flecha-derecha
  navegacion: [
    { texto: 'Inicio', icono: 'inicio', url: '/' },
    { texto: 'Artículos', icono: 'lapiz', url: '/articulos/' },
    { texto: 'Temas', icono: 'libro', url: '/categorias/' },
    { texto: 'Webcomics', icono: 'pelicula', url: '/webcomics/' }, // quítalo si no harás webcomics
    { texto: 'Sobre mí', icono: 'usuario', url: '/sobre-mi/' },
  ],
  botonMenu: { texto: 'Suscribirme', icono: 'correo', url: '/#newsletter' },

  // --------------------------------------------------------------------------
  // 4. PORTADA (página de inicio)
  // --------------------------------------------------------------------------
  hero: {
    // Insignias flotantes alrededor del título. color = amarillo|verde|rosa|azul|naranja|morado
    insignias: [
      { texto: 'LEE Y APRENDE', color: 'verde', posicion: 'tl' },
      { texto: 'ENSAYOS SEMANALES', color: 'amarillo', posicion: 'tr' },
      { texto: 'IDEAS Y PROYECTOS', color: 'naranja', posicion: 'bl' },
      { texto: 'TU CIUDAD', color: 'verde', posicion: 'br' },
    ],
    // La frase se arma así: fraseInicio + [resaltado] + fraseFin
    fraseInicio: 'Escribo sobre ideas, aprendizaje y proyectos que',
    resaltado: 'VALEN',
    fraseFin: 'la pena.',
    boton: { texto: 'EXPLORAR ARTÍCULOS', url: '/articulos/', icono: 'flecha-abajo' },
    mostrarAutor: false, // tarjetita "Escrito por..." bajo el botón
    mostrarEstadisticas: true, // artículos / temas / desde año
  },

  home: {
    mostrarDestacado: true, // gran tarjeta con el artículo destacado
    cantidadUltimos: 6, // cuántos artículos recientes se muestran en la portada
    mostrarWebcomics: true, // sección de webcomics (solo aparece si hay alguno publicado)
    mostrarTemas: true, // sección "Explora por tema"
    mostrarAutor: true, // sección corta "Quién escribe"
    mostrarNewsletter: true,
  },

  // --------------------------------------------------------------------------
  // 5. LISTADO DE ARTÍCULOS (/articulos/)
  // --------------------------------------------------------------------------
  listado: {
    porPagina: 12,
    etiqueta: 'todo lo que he escrito',
    titulo: 'Artículos',
    descripcion: 'Todas las entradas del cuaderno, de la más nueva a la más antigua.',
  },

  // --------------------------------------------------------------------------
  // 5b. WEBCOMICS (/webcomics/)
  //     Para publicar uno: en el .md/.mdx del artículo pon  tipo: webcomic
  //     y el bloque comic: (mira el README o los ejemplos en src/content/posts/)
  // --------------------------------------------------------------------------
  webcomics: {
    etiqueta: 'historias en viñetas',
    titulo: 'Webcomics',
    descripcion: 'Series y one-shots para leer capítulo a capítulo.',
    vacio: 'Todavía no hay webcomics publicados.',
  },

  // --------------------------------------------------------------------------
  // 6. ARTÍCULO INDIVIDUAL
  // --------------------------------------------------------------------------
  articulo: {
    barraProgreso: true, // barra de lectura arriba
    mostrarIndice: true, // columna IZQUIERDA: índice fijo (sticky). En webcomics muestra los capítulos
    mostrarRelacionados: true,
    mostrarAnteriorSiguiente: true,
    // Columna DERECHA (información extra, discreta). Cambia el orden o quita nombres.
    // Opciones: meta | autor | etiquetas | compartir | recientes | categorias | buscar | newsletter
    barraDerecha: ['meta', 'autor', 'etiquetas', 'compartir'],
    // Comentarios con Giscus (gratis, usa GitHub Discussions). Pasos en el README.
    comentarios: {
      activo: false,
      repo: '', // ej: 'usuario/mi-blog'
      repoId: '',
      categoria: '',
      categoriaId: '',
    },
  },

  // --------------------------------------------------------------------------
  // 7. WIDGETS DE LA BARRA LATERAL
  //    Cambia el ORDEN o quita nombres de la lista para ocultarlos.
  //    Disponibles: buscar | sobreMi | categorias | recientes | etiquetas | newsletter
  // --------------------------------------------------------------------------
  widgets: {
    barraLateral: ['sobreMi', 'categorias', 'recientes', 'etiquetas', 'newsletter'],
    recientesCantidad: 4,
    etiquetasMaximo: 20,
  },

  // --------------------------------------------------------------------------
  // 8. CATEGORÍAS (la "clave" es lo que escribes en cada artículo: categoria: 'ideas')
  // --------------------------------------------------------------------------
  categorias: {
    ideas: {
      nombre: 'Ideas',
      emoji: '💡',
      color: 'amarillo',
      descripcion: 'Reflexiones, modelos mentales y preguntas que me rondan la cabeza.',
    },
    aprendizaje: {
      nombre: 'Aprendizaje',
      emoji: '📚',
      color: 'verde',
      descripcion: 'Cómo estudio, tomo notas y retengo lo que leo.',
    },
    proyectos: {
      nombre: 'Proyectos',
      emoji: '🛠️',
      color: 'rosa',
      descripcion: 'Cosas que construyo, paso a paso y con errores incluidos.',
    },
    vida: {
      nombre: 'Vida diaria',
      emoji: '🌱',
      color: 'azul',
      descripcion: 'Hábitos, rutinas y pequeñas decisiones del día a día.',
    },
    webcomics: {
      nombre: 'Webcomics',
      color: 'azul',
      emoji: '💬',
      descripcion: 'Historias en viñetas, capítulo a capítulo.',
    },
  },

  // --------------------------------------------------------------------------
  // 9. NEWSLETTER
  //    "accion" es la URL de tu servicio de formularios (Formspree, Getform,
  //    Basin...). Si la dejas vacía el formulario funciona en modo demostración.
  // --------------------------------------------------------------------------
  newsletter: {
    activo: true,
    titulo: 'Únete al Diario del Domingo 📬',
    texto: 'Un resumen semanal con lo nuevo del cuaderno y algunas notas que no publico en otro lado. Sin spam.',
    textoWidget: 'Recibe lo nuevo del cuaderno cada semana.',
    placeholder: 'tu.correo@dominio.com',
    boton: 'SUSCRIBIRME',
    accion: '', // ej: 'https://formspree.io/f/xxxxxxx'
    campo: 'email', // nombre del campo que espera tu servicio
    mensajeOk: '¡Listo! Revisa tu correo para confirmar.',
    mensajeError: 'Algo falló. Inténtalo de nuevo en un momento.',
    mensajeDemo: 'Modo demostración: configura newsletter.accion en sitio.js para recibir correos reales.',
  },

  // --------------------------------------------------------------------------
  // 10. PÁGINA "SOBRE MÍ" (/sobre-mi/)
  // --------------------------------------------------------------------------
  sobreMi: {
    etiqueta: 'quién escribe esto',
    titulo: 'Hola, soy Tu Nombre',
    leyendaFoto: 'yo, escribiendo ✍️',
    parrafos: [
      'Empecé este blog porque mis ideas vivían dispersas en notas sueltas y conversaciones que se perdían. Aquí las ordeno, las pulo y las dejo abiertas para quien quiera leerlas.',
      'Escribo sobre cómo aprendo, qué construyo y las pequeñas decisiones que hacen que los días funcionen. No soy experto en todo: escribo para entender mejor y compartir el camino.',
      'Si algo de lo que lees te sirve, o crees que me equivoco, escríbeme. Las mejores ideas de este cuaderno nacieron de una conversación.',
    ],
    datos: [
      { etiqueta: 'Escribo desde', valor: 'Tu ciudad' },
      { etiqueta: 'Temas', valor: 'Ideas, aprendizaje, proyectos' },
      { etiqueta: 'Publico', valor: 'Cuando tengo algo que decir' },
      { etiqueta: 'Café favorito', valor: 'El de la mañana ☕' },
    ],
    intereses: ['Escribir', 'Leer', 'Programar', 'Dibujar', 'Caminar', 'Aprender idiomas'],
    tituloIntereses: 'Cosas que me gustan',
  },

  // --------------------------------------------------------------------------
  // 11. PIE DE PÁGINA
  // --------------------------------------------------------------------------
  pie: {
    texto: 'Hecho con cariño y Astro.',
    enlaces: [
      { texto: 'Artículos', url: '/articulos/' },
      { texto: 'Temas', url: '/categorias/' },
      { texto: 'Sobre mí', url: '/sobre-mi/' },
      { texto: 'RSS', url: '/rss.xml' },
    ],
  },

  // --------------------------------------------------------------------------
  // 12. TEXTOS DE LA INTERFAZ (cámbialos si quieres otro idioma o tono)
  // --------------------------------------------------------------------------
  textos: {
    leer: 'Leer >',
    leerArticulo: 'LEER ARTÍCULO >',
    verTodos: 'Ver todos los artículos >',
    nuevo: 'NUEVO',
    destacado: 'DESTACADO',
    ultimos: 'Últimos artículos',
    temas: 'Explora por tema',
    temasSub: 'Elige un tema y sigue el hilo.',
    autorSeccion: 'Quién escribe',
    escritoPor: 'Escrito por',
    minLectura: 'min de lectura',
    articulos: 'artículos',
    temasPlural: 'temas',
    desde: 'desde',
    buscar: 'Buscar',
    buscarPlaceholder: 'Buscar en el cuaderno...',
    sinResultados: 'Sin resultados.',
    widgetCategorias: 'Temas',
    widgetRecientes: 'Lo más nuevo',
    widgetEtiquetas: 'Etiquetas',
    widgetSobreMi: 'Quién escribe',
    verMas: 'Conóceme >',
    indice: 'En este artículo',
    compartir: 'Compartir',
    copiarEnlace: 'Copiar enlace',
    enlaceCopiado: '¡Copiado!',
    anterior: '< Anterior',
    siguiente: 'Siguiente >',
    relacionados: 'Sigue leyendo',
    comentarios: 'Comentarios',
    inicio: 'Inicio',
    paginaAnterior: '< Más nuevos',
    paginaSiguiente: 'Más antiguos >',
    articulosEn: 'Artículos en',
    articulosCon: 'Artículos con la etiqueta',
    volverInicio: '← Volver al inicio',
    noEncontrada: 'Esta página no existe',
    noEncontradaTexto: 'Puede que el enlace esté roto o que la página se haya movido. Aquí tienes lo más reciente:',
    todosLosTemas: 'Todos los temas',
    temaDe: 'artículos',
    menu: 'Menú',
    cambiarTema: 'Cambiar entre modo claro y oscuro',
    suscribirseRss: 'RSS',
    // --- webcomics ---
    comic: 'COMIC',
    capitulo: 'Capítulo',
    capitulos: 'capítulos',
    capAbrev: 'Cap.',
    pagina: 'Página',
    paginas: 'páginas',
    anteriorCap: 'Capítulo anterior',
    siguienteCap: 'Capítulo siguiente',
    verCapitulos: 'Capítulos',
    finPorAhora: 'Fin por ahora',
    webcomicsTitulo: 'Webcomics',
    verTodosComics: 'Ver todos los webcomics >',
    empezarLeer: 'EMPEZAR A LEER',
    ultimoCap: 'Último capítulo',
    lecturaRtl: 'Lectura de derecha a izquierda',
    // --- columna derecha del artículo ---
    info: 'Info',
    tema: 'Tema',
    publicado: 'Publicado',
    actualizadoEn: 'Actualizado',
    lectura: 'Lectura',
    infoExtra: 'Información extra',

    // --- explorador de artículos ---
    explorarTitulo: 'Explorar artículos',
    explorarPlaceholder: 'Buscar por título, tema o etiqueta…',
    explorarTodo: 'Todo',
    explorarResultados: 'resultados',
    explorarVacio: 'No encontré nada con eso.',
    cerrar: 'Cerrar',
    mostrarMas: 'Mostrar más',
  },

  // --------------------------------------------------------------------------
  // 13. APARIENCIA
  //    Colores en formato #rrggbb. Puedes cambiar toda la paleta aquí.
  // --------------------------------------------------------------------------
  tema: {
    modoOscuro: true, // muestra el botón claro/oscuro
    inicial: 'sistema', // 'sistema' | 'claro' | 'oscuro'
    acentos: {
      amarillo: '#ffcf25',
      verde: '#34d399',
      rosa: '#f472b6',
      azul: '#60a5fa',
      naranja: '#fb923c',
      morado: '#a78bfa',
    },
    claro: {
      fondo: '#fbfbf9',
      rejilla: '#e5e5df',
      texto: '#121212',
      suave: '#52525b',
      borde: '#1e1e1e',
      tarjeta: '#ffffff',
      panel: '#18181b',
      textoPanel: '#f4f4f5',
      cinta: 'rgba(245, 235, 200, 0.75)',
    },
    oscuro: {
      fondo: '#121214',
      rejilla: '#1d1d21',
      texto: '#f4f4f5',
      suave: '#a1a1aa',
      borde: '#f4f4f5',
      tarjeta: '#1c1c21',
      panel: '#2a2a31',
      textoPanel: '#f4f4f5',
      cinta: 'rgba(120, 110, 80, 0.65)',
    },
  },

  fuentes: {
    // Enlace de Google Fonts (si cambias fuentes, actualiza también los nombres de abajo)
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=VT323&family=Plus+Jakarta+Sans:wght@500;700;800&family=Press+Start+2P&display=swap',
    principal: "'Plus Jakarta Sans', system-ui, sans-serif", // texto general
    manuscrita: "'Caveat', cursive", // etiquetas a mano
    pixel: "'Press Start 2P', monospace", // título del hero
    mono: "'VT323', monospace", // pestañas y detalles
  },
};
