// ============================================================================
//  panel/galeria.js — pestaña "Galería" del panel: álbumes, subálbumes y fotos
//  Usa window.Panel (definido en index.html). Los datos viven en public/galeria.
// ============================================================================
(() => {
  'use strict';
  const { h, api, aviso } = window.Panel;

  document.head.append(h('style', {}, `
    .g-caja { border:1px solid var(--line); border-radius:10px; background:var(--panel); padding:12px; margin:10px 0; }
    .g-caja h3 { margin:0 0 8px; font-size:1rem; }
    .g-ruta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:0 0 8px; }
    .g-ruta button { border:0; background:none; color:var(--acc); cursor:pointer; padding:2px 4px; font-weight:600; }
    .g-campos { display:grid; grid-template-columns:130px minmax(0,1fr); gap:8px 12px; align-items:start; }
    .g-campos > label { padding-top:7px; font-weight:600; }
    .g-campos input[type=text], .g-campos input[type=date], .g-campos textarea, .g-campos select { width:100%; }
    .g-campos textarea { min-height:90px; font-family:inherit; }
    .g-pista { color:var(--muted); font-size:.82rem; }
    .g-albumes { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; }
    .g-album { border:1px solid var(--line); border-radius:10px; background:var(--panel); overflow:hidden; cursor:pointer; text-align:left; padding:0; color:inherit; font:inherit; }
    .g-album:hover { border-color:var(--acc); }
    .g-album .im { height:110px; background:#8882; display:grid; place-items:center; color:var(--muted); }
    .g-album img { width:100%; height:110px; object-fit:cover; display:block; }
    .g-album .tx { padding:8px 10px; display:flex; flex-direction:column; gap:2px; }
    .g-album small { color:var(--muted); }
    .g-fotos { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; margin-top:8px; }
    .g-foto { border:2px solid transparent; border-radius:8px; background:var(--panel); padding:4px; cursor:pointer; display:flex; flex-direction:column; gap:4px; font-size:.78rem; }
    .g-foto:hover { border-color:var(--line); }
    .g-foto.sel { border-color:var(--acc); }
    .g-foto img { width:100%; height:95px; object-fit:cover; border-radius:6px; display:block; }
    .g-foto span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .g-foto .mov { display:flex; gap:4px; }
    .g-drop { border:2px dashed var(--line); border-radius:10px; padding:18px; text-align:center; color:var(--muted); }
    .g-drop.sobre { border-color:var(--acc); color:var(--ink); }
    .g-fila { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:6px 0; }
    .g-sticky { position:sticky; top:62px; z-index:5; }
    .g-aviso { color:var(--warn); }
    @media (max-width:700px){ .g-campos { grid-template-columns:1fr; } .g-campos > label { padding-top:0; } }
  `));

  const raizArbol = (arbol, ruta) => {
    if (!ruta) return { ruta: '', titulo: 'Galería', hijos: arbol };
    const buscar = (nodos) => { for (const n of nodos) { if (n.ruta === ruta) return n; const r = buscar(n.hijos); if (r) return r; } return null; };
    return buscar(arbol);
  };
  const plano = (nodos, sal = []) => { for (const n of nodos) { sal.push(n); plano(n.hijos, sal); } return sal; };
  const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
  const kb = (b) => (b / 1024).toFixed(0) + ' KB';
  const leerB64 = (blob) => new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = () => mal(new Error('No pude leer el archivo.'));
    r.readAsDataURL(blob);
  });
  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); aviso('Enlace copiado'); }
    catch { window.prompt('Copia este enlace:', texto); }
  };

  // -------------------------------------------------------------------------
  let ruta = ''; // álbum abierto ('' = lista de álbumes principales)
  let arbol = [];
  let album = null; // datos del álbum abierto (se editan aquí y se guardan con el botón)
  let fotoSel = null; // id de la foto que se está editando
  let sucio = false;
  let contenedor = null;

  async function cargar() {
    arbol = (await api('galeria')).albumes;
    album = ruta ? await api('galeria/album?ruta=' + encodeURIComponent(ruta)) : null;
    if (ruta && album && !album.fotos.some((f) => f.id === fotoSel)) fotoSel = null;
    sucio = false;
    pintarTodo();
  }
  const abrir = async (r) => {
    if (sucio && !confirm('Tienes cambios sin guardar en este álbum. ¿Salir sin guardarlos?')) return;
    ruta = r; fotoSel = null;
    try { await cargar(); } catch (e) { aviso(e.message, true); ruta = ''; await cargar(); }
  };
  const marcar = () => { sucio = true; const b = document.getElementById('g-guardar'); if (b) { b.disabled = false; b.textContent = 'Guardar cambios'; } };

  async function guardar() {
    try {
      await api('galeria/album/guardar', 'POST', { ruta, album });
      sucio = false;
      aviso('Álbum guardado');
      await cargar();
    } catch (e) { aviso(e.message, true); }
  }

  async function crear(padre, input) {
    const titulo = input.value.trim();
    if (!titulo) return aviso('Escribe un título.', true);
    if (sucio && !confirm('Tienes cambios sin guardar. ¿Continuar sin guardarlos?')) return;
    try {
      const r = await api('galeria/album/crear', 'POST', { padre, titulo });
      ruta = r.ruta; fotoSel = null;
      await cargar();
      aviso('Álbum creado');
    } catch (e) { aviso(e.message, true); }
  }

  // -------------------------------------------------------------------------
  function rutaNav() {
    const partes = ruta ? ruta.split('/') : [];
    const nodos = [h('button', { onclick: () => abrir('') }, '🖼 Galería')];
    partes.forEach((_, i) => {
      const r = partes.slice(0, i + 1).join('/');
      const n = raizArbol(arbol, r);
      nodos.push(h('span', {}, '/'), h('button', { onclick: () => abrir(r) }, n?.titulo ?? partes[i]));
    });
    return h('div', { class: 'g-ruta' }, nodos);
  }

  function formNuevo(padre, etiqueta) {
    const input = h('input', { type: 'text', placeholder: etiqueta, style: 'flex:1;min-width:180px', onkeydown: (e) => { if (e.key === 'Enter') crear(padre, input); } });
    return h('div', { class: 'g-fila' }, input, h('button', { class: 'btn', onclick: () => crear(padre, input) }, '+ Crear'));
  }

  function tarjetaAlbum(n) {
    return h('button', { class: 'g-album', onclick: () => abrir(n.ruta) },
      h('div', { class: 'im' }, n.portada ? h('img', { src: `/galeria-img/${n.ruta}/${n.portada}-m.webp`, alt: '', loading: 'lazy' }) : 'Sin fotos'),
      h('div', { class: 'tx' }, h('b', {}, n.titulo), h('small', {}, `${n.fotos} foto${n.fotos === 1 ? '' : 's'}${n.hijos.length ? ` · ${n.hijos.length} subálbum${n.hijos.length === 1 ? '' : 'es'}` : ''}`),
        n.noListado && h('small', {}, '🔒 No listado')));
  }

  function vistaRaiz() {
    return [
      h('div', { class: 'g-caja' },
        h('h3', {}, 'Álbumes'),
        arbol.length ? h('div', { class: 'g-albumes' }, arbol.map(tarjetaAlbum)) : h('p', { class: 'vacio' }, 'Todavía no hay álbumes. Crea el primero aquí abajo.'),
        formNuevo('', 'Título del nuevo álbum (ej. Paisajes)')),
      h('p', { class: 'g-pista' }, 'Las fotos se guardan en public/galeria. Al publicar desde el panel se suben junto con el resto. Tus originales no se tocan: guárdalos aparte.'),
    ];
  }

  function campo(etiqueta, control, pista) {
    return [h('label', {}, etiqueta), h('div', {}, control, pista && h('div', { class: 'g-pista' }, pista))];
  }

  function vistaAlbum() {
    const nodo = raizArbol(arbol, ruta);
    const nivel = ruta.split('/').length;
    const sel = album.fotos.find((f) => f.id === fotoSel);
    const enlaceAlbum = `/galeria/${ruta}/`;

    const campos = [
      campo('Título', h('input', { type: 'text', value: album.titulo, oninput: (e) => { album.titulo = e.target.value; marcar(); } })),
      campo('Fecha', h('input', { type: 'date', value: album.fecha, onchange: (e) => { album.fecha = e.target.value; marcar(); } })),
      campo('Etiquetas', h('input', { type: 'text', value: album.etiquetas.join(', '), placeholder: 'paisaje, acuarela, 2026', oninput: (e) => { album.etiquetas = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); marcar(); } }), 'Separadas por coma.'),
      campo('Descripción', h('textarea', { oninput: (e) => { album.descripcion = e.target.value; marcar(); } }, album.descripcion), 'Admite markdown: **negrita**, *cursiva*, [enlaces](https://…) y listas con -.'),
      nivel === 1 && album.fotos.length
        ? campo('Portada', h('select', { onchange: (e) => { album.portada = e.target.value; marcar(); } },
          h('option', { value: '', selected: !album.portada }, 'La primera foto'),
          album.fotos.map((f) => h('option', { value: f.id, selected: album.portada === f.id }, f.titulo || f.id))), 'Solo los álbumes principales llevan portada.')
        : null,
      campo('Visibilidad', h('label', { class: 'interruptor' },
        h('input', { type: 'checkbox', checked: album.noListado, onchange: (e) => { album.noListado = e.target.checked; marcar(); } }),
        'No listado (solo se abre con su enlace)'), 'Un álbum no listado no sale en /galeria/, ni en el buscador ni en el sitemap, y sus subálbumes tampoco.'),
    ].flat().filter(Boolean);

    const datos = h('div', { class: 'g-caja' },
      h('h3', {}, 'Datos del álbum'),
      h('div', { class: 'g-campos' }, campos),
      h('div', { class: 'g-fila' },
        h('button', { class: 'btn primario', id: 'g-guardar', disabled: !sucio, onclick: guardar }, sucio ? 'Guardar cambios' : 'Sin cambios'),
        h('button', { class: 'btn', onclick: () => copiar(enlaceAlbum) }, 'Copiar enlace del álbum'),
        h('button', { class: 'btn peligro', onclick: borrarAlbum }, 'Borrar álbum')));

    const subs = h('div', { class: 'g-caja' },
      h('h3', {}, `Subálbumes (${nodo?.hijos.length ?? 0})`),
      nodo?.hijos.length ? h('div', { class: 'g-albumes' }, nodo.hijos.map(tarjetaAlbum)) : h('p', { class: 'vacio' }, 'No hay subálbumes.'),
      nivel < 4 ? formNuevo(ruta, 'Título del nuevo subálbum') : h('p', { class: 'g-pista' }, 'Máximo 4 niveles.'));

    return [rutaNav(), datos, subs, subir(), vistaFotos(sel)];
  }

  async function borrarAlbum() {
    const n = raizArbol(arbol, ruta);
    const total = plano(n ? [n] : []).reduce((s, x) => s + x.fotos, 0);
    if (!confirm(`¿Borrar el álbum "${album.titulo}" con ${total} foto(s) y todos sus subálbumes? No se puede deshacer (solo desde git).`)) return;
    try {
      await api('galeria/album/borrar', 'POST', { ruta });
      sucio = false;
      ruta = ruta.split('/').slice(0, -1).join('/');
      aviso('Álbum borrado');
      await cargar();
    } catch (e) { aviso(e.message, true); }
  }

  // -------------------------------------------------------------------------
  function subir() {
    const estado = h('div');
    const input = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    const zona = h('div', { class: 'g-drop' },
      h('p', { style: 'margin:0 0 8px' }, 'Arrastra aquí tus fotos o dibujos (JPG, PNG, WebP…)'),
      h('button', { class: 'btn', onclick: () => input.click() }, 'Elegir archivos'),
      h('p', { class: 'g-pista', style: 'margin:8px 0 0' }, 'El panel crea la miniatura y la foto del visor en WebP. Se pueden subir muchas a la vez.'));
    const subirTodas = async (archivos) => {
      const lista = [...archivos].filter((f) => f.type.startsWith('image/'));
      if (!lista.length) return aviso('Eso no parece una imagen.', true);
      if (sucio) { await guardar(); }
      let bien = 0, bytes = 0;
      for (const [i, f] of lista.entries()) {
        estado.replaceChildren(h('p', {}, `Procesando ${i + 1} de ${lista.length}: ${f.name}…`));
        try {
          const r = await api('galeria/foto/subir', 'POST', { album: ruta, nombre: f.name, datos: await leerB64(f), modificado: f.lastModified });
          bien++; bytes += r.bytes;
        } catch (e) { estado.append(h('p', { class: 'g-aviso' }, `✕ ${f.name}: ${e.message}`)); }
      }
      aviso(`${bien} foto(s) subida(s) · ${mb(bytes)} en total`);
      const aparte = estado.querySelectorAll('.g-aviso').length ? [...estado.querySelectorAll('.g-aviso')] : [];
      await cargar();
      if (aparte.length) contenedor.querySelector('[data-subida]')?.append(...aparte);
    };
    input.onchange = () => { subirTodas(input.files); input.value = ''; };
    ['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('sobre'); }));
    ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.remove('sobre'); }));
    zona.addEventListener('drop', (e) => subirTodas(e.dataTransfer.files));
    return h('div', { class: 'g-caja', 'data-subida': true }, h('h3', {}, 'Subir fotos'), zona, input, estado);
  }

  // -------------------------------------------------------------------------
  function mover(id, delta) {
    const i = album.fotos.findIndex((f) => f.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= album.fotos.length) return;
    [album.fotos[i], album.fotos[j]] = [album.fotos[j], album.fotos[i]];
    marcar(); pintarTodo();
  }

  function vistaFotos(sel) {
    const n = album.fotos.length;
    const cab = h('div', { class: 'g-caja' },
      h('h3', {}, `Fotos (${n})`),
      n > 300 && h('p', { class: 'g-aviso' }, 'Este álbum ya tiene más de 300 fotos: la página se vuelve pesada. Conviene dividirlo en subálbumes (por ejemplo, por año).'),
      n > 1 && h('div', { class: 'g-fila' },
        h('button', { class: 'btn', onclick: () => { album.fotos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')); marcar(); pintarTodo(); } }, 'Ordenar por fecha (nuevas primero)'),
        h('span', { class: 'g-pista' }, 'El orden de aquí es el que verá el público.')),
      n ? h('div', { class: 'g-fotos' }, album.fotos.map((f, i) =>
        h('div', { class: 'g-foto' + (f.id === fotoSel ? ' sel' : ''), onclick: () => { fotoSel = f.id; pintarTodo(); } },
          h('img', { src: `/galeria-img/${ruta}/${f.id}-m.webp`, alt: '', loading: 'lazy' }),
          h('span', { title: f.titulo }, f.titulo || f.id),
          h('div', { class: 'mov' },
            h('button', { class: 'btn mini', title: 'Mover antes', disabled: i === 0, onclick: (e) => { e.stopPropagation(); mover(f.id, -1); } }, '←'),
            h('button', { class: 'btn mini', title: 'Mover después', disabled: i === n - 1, onclick: (e) => { e.stopPropagation(); mover(f.id, 1); } }, '→'))))) : h('p', { class: 'vacio' }, 'Este álbum todavía no tiene fotos.'));
    return h('div', {}, sel ? editorFoto(sel) : null, cab);
  }

  function editorFoto(f) {
    const nivel = ruta.split('/').length;
    const otros = plano(arbol).filter((x) => x.ruta !== ruta);
    const destino = h('select', {}, h('option', { value: '' }, 'Mover a otro álbum…'), otros.map((x) => h('option', { value: x.ruta }, x.ruta.split('/').map((_, i, p) => raizArbol(arbol, p.slice(0, i + 1).join('/'))?.titulo ?? '').join(' / '))));
    return h('div', { class: 'g-caja g-sticky', style: 'border-color:var(--acc)' },
      h('h3', {}, 'Editando: ' + (f.titulo || f.id)),
      h('div', { style: 'display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px' },
        h('img', { src: `/galeria-img/${ruta}/${f.id}-g.webp`, alt: '', style: 'width:140px;max-height:200px;object-fit:contain;border-radius:8px;background:#8882' }),
        h('div', { class: 'g-campos', style: 'grid-template-columns:90px minmax(0,1fr)' },
          campo('Título', h('input', { type: 'text', value: f.titulo, oninput: (e) => { f.titulo = e.target.value; marcar(); } })),
          campo('Fecha', h('input', { type: 'date', value: f.fecha, onchange: (e) => { f.fecha = e.target.value; marcar(); } })),
          campo('Etiquetas', h('input', { type: 'text', value: f.etiquetas.join(', '), placeholder: 'boceto, personaje', oninput: (e) => { f.etiquetas = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); marcar(); } })),
          campo('Descripción', h('textarea', { oninput: (e) => { f.descripcion = e.target.value; marcar(); } }, f.descripcion), 'Markdown: para dibujos con historia puedes escribir párrafos, **negrita**, *cursiva* y enlaces.'))),
      h('div', { class: 'g-fila' },
        h('button', { class: 'btn primario', onclick: guardar }, 'Guardar cambios'),
        nivel === 1 && h('button', { class: 'btn', onclick: () => { album.portada = f.id; marcar(); aviso('Será la portada al guardar'); } }, 'Usar de portada del álbum'),
        h('button', { class: 'btn', onclick: () => copiar(`/galeria/${ruta}/#${f.id}`) }, 'Copiar enlace de la foto'),
        otros.length ? [destino, h('button', { class: 'btn', onclick: async () => {
          if (!destino.value) return aviso('Elige el álbum de destino.', true);
          try {
            if (sucio) await api('galeria/album/guardar', 'POST', { ruta, album });
            await api('galeria/foto/mover', 'POST', { album: ruta, id: f.id, a: destino.value });
            fotoSel = null; aviso('Foto movida'); await cargar();
          } catch (e) { aviso(e.message, true); }
        } }, 'Mover')] : null,
        h('button', { class: 'btn peligro', onclick: async () => {
          if (!confirm(`¿Borrar la foto "${f.titulo || f.id}"? Se eliminan sus dos archivos.`)) return;
          try {
            if (sucio) await api('galeria/album/guardar', 'POST', { ruta, album });
            await api('galeria/foto/borrar', 'POST', { album: ruta, id: f.id });
            fotoSel = null; aviso('Foto borrada'); await cargar();
          } catch (e) { aviso(e.message, true); }
        } }, 'Borrar foto'),
        h('button', { class: 'btn', onclick: () => { fotoSel = null; pintarTodo(); } }, 'Cerrar')));
  }

  // -------------------------------------------------------------------------
  function pintarTodo() {
    if (!contenedor?.isConnected) return;
    const y = window.scrollY;
    contenedor.replaceChildren(...(ruta && album ? vistaAlbum() : [rutaNav(), ...vistaRaiz()]));
    window.scrollTo(0, y);
  }

  window.Galeria = {
    async pintar(_seccion, main) {
      contenedor = h('div', {}, h('p', { class: 'vacio' }, 'Cargando…'));
      main.append(contenedor);
      try { await cargar(); } catch (e) { contenedor.replaceChildren(h('p', {}, 'No pude leer la galería: ' + e.message)); }
    },
  };
})();
