// ============================================================================
//  sitio.js  —  AQUÍ SE EDITA TODO EL SITIO
//  Nombre, textos, menú, colores, fuentes, categorías, widgets, newsletter...
//  Los artículos se escriben aparte, en src/content/posts/*.md
//
//  Este archivo lo puede regenerar el panel de control (pnpm panel).
//  Si lo editas a mano, los comentarios dentro de cada sección se pierden
//  la próxima vez que guardes desde el panel.
// ============================================================================

export const sitio = {
  // --------------------------------------------------------------------------
  // 1. DATOS GENERALES
  // --------------------------------------------------------------------------
  url: 'https://blogdeoliver.pages.dev',

  base: '',

  idioma: 'es',

  nombre: 'Mi Cuaderno Digital',

  eslogan: 'mi cuaderno digital',

  descripcion: 'Un rincón tranquilo de internet donde escribo sobre ideas, aprendizaje, proyectos y vida diaria.',

  imagenCompartir: '',

  // --------------------------------------------------------------------------
  // 2. AUTOR
  // --------------------------------------------------------------------------
  autor: {
    nombre: 'Tu Nombre',
    rol: 'Un Curioso de Tiempo Completo',
    ubicacion: '',
    avatar: '/img/avatar.webp',
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
  navegacion: [
    { texto: 'Inicio', icono: 'inicio', url: '/' },
    { texto: 'Artículos', icono: 'lapiz', url: '/articulos/' },
    { texto: 'Webcomics', icono: 'pelicula', url: '/webcomics/' },
    { texto: 'Mis Dibujos', icono: 'imagen', url: '/galeria/' },
    { texto: 'Temas', icono: 'libro', url: '/categorias/' },
    { texto: 'Sobre mí', icono: 'usuario', url: '/sobre-mi/' },
  ],

  botonMenu: { texto: 'Suscribirme', icono: 'correo', url: '/#newsletter' },

  // --------------------------------------------------------------------------
  // 4. PORTADA (página de inicio)
  // --------------------------------------------------------------------------
  hero: {
    insignias: [
      { texto: 'LEE Y APRENDE', color: 'verde', posicion: 'tl' },
      { texto: 'ENSAYOS SEMANALES', color: 'amarillo', posicion: 'tr' },
      { texto: 'IDEAS Y PROYECTOS', color: 'naranja', posicion: 'bl' },
      { texto: 'TU CIUDAD', color: 'verde', posicion: 'br' },
    ],
    fraseInicio: 'Escribo sobre ideas, aprendizaje y proyectos que',
    resaltado: 'Valen',
    fraseFin: 'la pena.',
    boton: { texto: 'EXPLORAR ARTÍCULOS', url: '/articulos/', icono: 'flecha-abajo' },
    mostrarAutor: false,
    mostrarEstadisticas: true,
  },

  // --------------------------------------------------------------------------
  // 4b. SECCIONES DE LA PORTADA
  // --------------------------------------------------------------------------
  home: {
    mostrarDestacado: false,
    cantidadDestacados: 3,
    cantidadDestacadosMovil: 2,
    cantidadUltimos: 6,
    mostrarWebcomics: true,
    mostrarTemas: true,
    mostrarAutor: true,
    mostrarNewsletter: true,
    orden: ['destacado', 'webcomics', 'autor', 'ultimos', 'temas', 'newsletter'],
  },

  // --------------------------------------------------------------------------
  // 5. LISTADO DE ARTÍCULOS (/articulos/)
  // --------------------------------------------------------------------------
  listado: {
    porPagina: 12,
    estilo: 'cuadricula',
    etiqueta: 'todo lo que he escrito',
    titulo: 'Artículos',
    descripcion: 'Aquí puedes encontrar un poco de lo que escribo.',
  },

  // --------------------------------------------------------------------------
  // 5b. WEBCOMICS (/webcomics/)
  // --------------------------------------------------------------------------
  webcomics: {
    etiqueta: 'Historias en Viñetas',
    titulo: 'Webcomics',
    descripcion: 'Series y one-shots para leer capítulo a capítulo.',
    vacio: 'Todavía no hay webcomics publicados.',
    emoji: '💬​',
  },

  emoji404: '🧭',

  // --------------------------------------------------------------------------
  // 6. ARTÍCULO INDIVIDUAL
  // --------------------------------------------------------------------------
  articulo: {
    barraProgreso: true,
    mostrarIndice: true,
    mostrarRelacionados: true,
    mostrarAnteriorSiguiente: true,
    barraDerecha: ['meta', 'autor', 'etiquetas', 'compartir'],
    comentarios: { activo: false, repo: '', repoId: '', categoria: '', categoriaId: '' },
  },

  // --------------------------------------------------------------------------
  // 7. WIDGETS DE LA BARRA LATERAL
  // --------------------------------------------------------------------------
  widgets: {
    barraLateral: ['sobreMi', 'categorias', 'recientes', 'etiquetas', 'newsletter'],
    recientesCantidad: 4,
    etiquetasMaximo: 20,
  },

  // --------------------------------------------------------------------------
  // 8. CATEGORÍAS (la "clave" es lo que escribes en cada artículo)
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
      emoji: '💬​',
      color: 'morado',
      descripcion: 'Historias en viñetas, capítulo a capítulo.',
    },
  },

  // --------------------------------------------------------------------------
  // 9. NEWSLETTER
  // --------------------------------------------------------------------------
  newsletter: {
    activo: true,
    titulo: 'Únete al Diario del Domingo 📬',
    texto: 'Un resumen semanal con lo nuevo del cuaderno y algunas notas que no publico en otro lado. Sin spam.',
    textoWidget: 'Recibe lo nuevo del cuaderno cada semana.',
    placeholder: 'tu.correo@dominio.com',
    boton: 'SUSCRIBIRME',
    accion: '',
    campo: 'email',
    mensajeOk: '¡Listo! Revisa tu correo para confirmar.',
    mensajeError: 'Algo falló. Inténtalo de nuevo en un momento.',
    mensajeDemo: 'Modo demostración: configura newsletter.accion en sitio.js para recibir correos reales.',
  },

  // --------------------------------------------------------------------------
  // 10. PÁGINA "SOBRE MÍ"
  // --------------------------------------------------------------------------
  sobreMi: {
    etiqueta: 'Hola, soy',
    titulo: 'Tu Nombre',
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
    ],
  },

  // --------------------------------------------------------------------------
  // 12. TEXTOS DE LA INTERFAZ
  // --------------------------------------------------------------------------
  textos: {
    leer: 'Leer >',
    leerArticulo: 'LEER ARTÍCULO >',
    verTodos: 'Ver todos los artículos >',
    nuevo: 'NUEVO',
    destacado: 'DESTACADO',
    destacadosTitulo: 'Destacados',
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
    volverInicio: '< Volver al inicio',
    noEncontrada: 'Esta página no existe',
    noEncontradaTexto: 'Puede que el enlace esté roto o que la página se haya movido. Aquí tienes lo más reciente:',
    todosLosTemas: 'Todos los temas',
    temaDe: 'artículos',
    menu: 'Menú',
    cambiarTema: 'Cambiar entre modo claro y oscuro',
    suscribirseRss: 'RSS',
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
    verSerie: 'VER SERIE',
    leerCapitulo: 'LEER CAPÍTULO',
    desliza: 'Desliza',
    lecturaRtl: 'Lectura de derecha a izquierda',
    novela: 'NOVELA',
    novelaEtiqueta: 'novela gráfica animada',
    retomado: 'Seguimos donde lo dejaste.',
    empezarDeNuevo: 'Empezar de nuevo',
    qteBien: '¡Bien!',
    qteMal: '¡Fallaste!',
    toca: 'TOCA',
    info: 'Info',
    tema: 'Tema',
    publicado: 'Publicado',
    actualizadoEn: 'Actualizado',
    lectura: 'Lectura',
    infoExtra: 'Información extra',
    explorarTitulo: 'Explorar artículos',
    explorarPlaceholder: 'Buscar por título, tema o etiqueta…',
    explorarTodo: 'Todo',
    explorarResultados: 'resultados',
    explorarVacio: 'No encontré nada con eso.',
    cerrar: 'Cerrar',
    mostrarMas: 'Mostrar más',
  },

  // --------------------------------------------------------------------------
  // 13. APARIENCIA (colores)
  // --------------------------------------------------------------------------
  tema: {
    modoOscuro: true,
    inicial: 'sistema',
    acentos: {
      amarillo: '#ffcf25',
      verde: '#34d399',
      rosa: '#f472b6',
      azul: '#60a5fa',
      naranja: '#fb923c',
      morado: '#a78bfa',
    },
    estilo: { esquinas: 'duras', bordeOpacidad: 8, bordeHover: 20, sombras: true },
    textoAcento: {},
    elementos: {
      progreso: 'azul',
      enlaces: 'amarillo',
      cita: '#ff5555',
      indiceActivo: '#ff5555',
      sombraNewsletter: '#ff5555',
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

  galeria: {
    urlBase: '/galeria',
    miniaturaAlto: 440,
    calidadMiniatura: 72,
    visorLado: 1800,
    calidadVisor: 90,
    titulo: 'Galeria',
    icono: 'imagen',
    etiqueta: 'Mis Dibujos',
    descripcion: 'Ilustraciones, bocetos y trabajos, organizados en álbumes.',
    vacio: 'Todavía no hay álbumes publicados.',
  },

  // --------------------------------------------------------------------------
  // 14. FUENTES
  // --------------------------------------------------------------------------
  fuentes: {
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=VT323&family=Plus+Jakarta+Sans:wght@500;700;800&family=Press+Start+2P&display=swap',
    principal: "'Plus Jakarta Sans', system-ui, sans-serif",
    manuscrita: "'Caveat', cursive",
    pixel: "'Press Start 2P', monospace",
    mono: "'VT323', monospace",
  },
};
