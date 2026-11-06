// ============================================================================
//  panel/assets.js — pestañas de Imágenes, Íconos y Fuentes + editor de acentos
//  Usa window.Panel (definido en index.html).
// ============================================================================
(() => {
  'use strict';
  const P = window.Panel;
  const { h, api, aviso } = P;
  const kb = (b) => (b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / 1024 / 1024).toFixed(2) + ' MB');
  const quitarExt = (n) => n.replace(/\.[^.]+$/, '');
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');

  // estilos propios
  document.head.append(h('style', {}, `
    .gal { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin:10px 0; }
    .gal .it { border:1px solid var(--line); border-radius:10px; background:var(--panel); padding:6px; display:flex; flex-direction:column; gap:4px; font-size:.8rem; }
    .gal .it img { width:100%; height:100px; object-fit:contain; background:repeating-conic-gradient(#8883 0 25%, transparent 0 50%) 0 0/14px 14px; border-radius:6px; }
    .gal .it b { word-break:break-all; } .gal .it .bt { display:flex; gap:4px; flex-wrap:wrap; }
    .caja { border:1px solid var(--line); border-radius:10px; background:var(--panel); padding:12px; margin:10px 0; }
    .caja h3 { margin:0 0 8px; font-size:1rem; }
    .opts { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin:8px 0; }
    .opts label { display:flex; gap:6px; align-items:center; }
    .opts input[type=text], .opts select { width:auto; }
    .prev { display:grid; grid-template-columns:90px 1fr auto; gap:10px; align-items:center; padding:6px 0; border-bottom:1px dashed var(--line); }
    .prev img { width:90px; height:60px; object-fit:contain; background:#8882; border-radius:6px; }
    .icos { display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:8px; margin:10px 0; }
    .icos button { display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 4px; border:1px solid var(--line); border-radius:10px; background:var(--panel); cursor:pointer; font-size:.78rem; word-break:break-all; }
    .icos button.sel { border-color:var(--acc); box-shadow:0 0 0 2px var(--acc); }
    .icos svg, .svgprev { width:28px; height:28px; stroke:currentColor; fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    .svgprev.grande { width:64px; height:64px; }
    .acento { display:grid; grid-template-columns:70px 130px 1fr auto; gap:10px; align-items:center; padding:8px 0; border-bottom:1px dashed var(--line); }
    .acento .muestra { height:40px; border-radius:8px; border:2px solid var(--line); display:grid; place-items:center; font-weight:800; }
    .acento .txtc { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    @media (max-width:800px){ .acento{grid-template-columns:70px 1fr;} .prev{grid-template-columns:70px 1fr;} }
  `));

  const leerB64 = (blob) => new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = () => mal(new Error('No pude leer el archivo.'));
    r.readAsDataURL(blob);
  });

  // ------------------------------------------------------------ IMÁGENES
  // Brave (y otros navegadores con protección anti-rastreo) añaden "ruido" al canvas: eso destruye
  // la compresión y hace que el WebP pese MUCHO más que el original. Lo detectamos con un color liso.
  function canvasAlterado() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.fillStyle = 'rgb(120,60,200)'; x.fillRect(0, 0, 64, 64);
      const d = x.getImageData(0, 0, 64, 64).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] !== 120 || d[i + 1] !== 60 || d[i + 2] !== 200) return true;
    } catch { return true; }
    return false;
  }
  const ALTERADO = canvasAlterado();

  async function aWebp(file, ancho, calidad) {
    const bmp = await createImageBitmap(file);
    // Si ya es WebP y no hay que reducirlo, no tiene sentido recomprimirlo
    if (file.type === 'image/webp' && !(ancho > 0 && bmp.width > ancho)) return { blob: file, w: bmp.width, h: bmp.height };
    const k = ancho > 0 ? Math.min(1, ancho / bmp.width) : 1;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', calidad));
    if (!blob || blob.type !== 'image/webp') throw new Error('Tu navegador no pudo crear WebP.');
    // Si pesa más que el original (y el original ya es ligero), mejor conservar el original cuando sea WebP
    return { blob, w: c.width, h: c.height };
  }

  // Con sharp instalado el panel optimiza en el servidor; si no, usa el navegador (canvas)
  let SERVIDOR = true;
  async function convertir(file, ancho, calidad, objetivo) {
    if (SERVIDOR) {
      try {
        const r = await api('imagenes/procesar', 'POST', { datos: await leerB64(file), ancho, calidad: Math.round(calidad * 100), objetivo });
        const blob = await (await fetch('data:image/webp;base64,' + r.datos)).blob();
        return { blob, w: r.w, h: r.h };
      } catch (e) {
        if (!/SIN_SHARP/.test(e.message)) throw e;
        SERVIDOR = false;
        aviso('Sin sharp: se optimiza en el navegador (menos eficiente). Instálalo con: pnpm add -D sharp', true);
      }
    }
    return aWebp(file, ancho, calidad);
  }

  function subidor(alTerminar) {
    const cola = [];
    const lista = h('div');
    const ancho = h('select', {}, [['400', '400 px (avatar, íconos)'], ['800', '800 px (miniaturas)'], ['1200', '1200 px'], ['1600', '1600 px (recomendado)'], ['2000', '2000 px'], ['0', 'Tamaño original']].map(([v, t]) => h('option', { value: v, selected: v === '1600' }, t)));
    const cal = h('input', { type: 'range', min: 50, max: 100, value: 82, style: 'width:140px' });
    const calTxt = h('span', {}, '82%');
    const objetivo = h('input', { type: 'number', min: 0, max: 5000, step: 50, value: 300, style: 'width:80px', title: '0 = sin límite' });
    const btnGuardar = h('button', { class: 'btn primario', disabled: true }, 'Guardar en src/assets/img');
    const repl = h('input', { type: 'checkbox' });

    const pintar = () => {
      lista.replaceChildren(...cola.map((c) => h('div', { class: 'prev' },
        c.url ? h('img', { src: c.url, alt: '' }) : h('div'),
        h('div', {},
          h('input', { type: 'text', value: c.nombre, 'aria-label': 'Nombre', oninput: (e) => { c.nombre = e.target.value; } }),
          h('div', { class: 'pista', style: 'color:var(--muted);font-size:.82rem' },
            c.error ? '✗ ' + c.error : c.blob ? `${kb(c.original)} → ${kb(c.blob.size)} · ${c.w}×${c.h}${c.ok ? ' · ✓ guardada' : ''}` : 'Procesando…'),
          c.blob && c.blob.size > c.original && c.blob.size > 150 * 1024
            ? h('div', { style: 'color:#d97706;font-size:.82rem;font-weight:700' }, '⚠ Pesa más que el original. Baja el ancho o la calidad' + (ALTERADO ? ' y desactiva los Escudos de Brave para esta página (ver aviso).' : '.'))
            : c.blob && c.blob.size > 500 * 1024 ? h('div', { style: 'color:#d97706;font-size:.82rem' }, '⚠ Pesa más de 500 KB: para web conviene bajar el ancho o la calidad.') : null),
        h('button', { class: 'btn mini peligro', onclick: () => { cola.splice(cola.indexOf(c), 1); pintar(); } }, '✕'))));
      btnGuardar.disabled = !cola.some((c) => c.blob && !c.ok);
    };
    const procesar = async () => {
      for (const c of cola) {
        c.blob = null; c.error = '';
        try { Object.assign(c, await convertir(c.file, Number(ancho.value), cal.value / 100, Number(objetivo.value) || 0)); c.url = URL.createObjectURL(c.blob); } catch (e) { c.error = e.message; }
      }
      pintar();
    };
    const agregar = async (files) => {
      for (const f of files) {
        if (!/^image\//.test(f.type) || /svg/.test(f.type)) { aviso(`"${f.name}" no es una imagen compatible (usa JPG, PNG, WebP, GIF, AVIF).`, true); continue; }
        cola.push({ file: f, nombre: slug(quitarExt(f.name)), original: f.size });
      }
      pintar();
      await procesar();
    };
    const entrada = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp', multiple: true, onchange: (e) => { agregar([...e.target.files]); e.target.value = ''; } });
    cal.oninput = () => { calTxt.textContent = cal.value + '%'; };
    cal.onchange = ancho.onchange = objetivo.onchange = () => procesar();
    btnGuardar.onclick = async () => {
      btnGuardar.disabled = true;
      let n = 0;
      for (const c of cola.filter((x) => x.blob && !x.ok)) {
        try {
          const r = await api('imagenes', 'POST', { nombre: c.nombre, datos: await leerB64(c.blob), reemplazar: repl.checked });
          c.ok = true; c.nombre = quitarExt(r.nombre); c.url = r.url + '?v=' + Date.now(); c.guardada = r.url; n++;
        } catch (e) { c.error = e.message; }
      }
      pintar();
      if (n) { aviso(`${n} imagen(es) guardada(s) como WebP`); alTerminar?.(cola.filter((c) => c.ok)); }
    };
    const caja = h('div', { class: 'caja' },
      h('h3', {}, 'Agregar imágenes desde tu computador'),
      ALTERADO && !SERVIDOR && h('div', { class: 'aviso', style: 'margin:6px 0' }, h('p', {}, '⚠ Tu navegador está alterando las imágenes del canvas (en Brave: Escudos). Eso hace que el WebP salga muchísimo más pesado y con ruido. Abre el icono del león junto a la barra de direcciones y desactiva los Escudos para localhost:4000, luego recarga el panel.')),
      entrada,
      h('div', { class: 'opts' },
        h('label', {}, 'Ancho máximo', ancho),
        h('label', {}, 'Calidad', cal, calTxt),
        h('label', {}, 'Peso máx. (KB)', objetivo),
        h('label', {}, repl, 'Reemplazar si ya existe')),
      lista, btnGuardar);
    return caja;
  }

  async function galeria(modo, elegir) {
    const { imagenes } = await api('imagenes');
    const cont = h('div', { class: 'gal' });
    if (!imagenes.length) return h('p', { class: 'vacio' }, 'Aún no hay imágenes en src/assets/img.');
    imagenes.forEach((i) => cont.append(h('div', { class: 'it' },
      h('img', { src: `/img/${encodeURIComponent(i.nombre)}?v=${i.fecha}`, alt: '', loading: 'lazy' }),
      h('b', {}, i.nombre),
      h('span', { style: 'color:var(--muted)' }, kb(i.bytes) + (i.usos.length ? ` · usada en ${i.usos.length}` : '')),
      h('div', { class: 'bt' },
        elegir
          ? h('button', { class: 'btn mini primario', onclick: () => elegir(i.url) }, 'Usar')
          : [
            h('button', { class: 'btn mini', onclick: async () => { try { await navigator.clipboard.writeText(i.url); aviso('Copiado: ' + i.url); } catch { aviso(i.url); } } }, 'Copiar ruta'),
            h('button', { class: 'btn mini peligro', onclick: async () => {
              const aviso2 = i.usos.length ? `\n\nOJO: aparece en: ${i.usos.join(', ')}. Se verá rota.` : '';
              if (!confirm(`¿Borrar ${i.nombre}?${aviso2}`)) return;
              try { await api('imagenes/borrar', 'POST', { nombre: i.nombre }); aviso('Imagen borrada'); modo?.(); } catch (e) { aviso(e.message, true); }
            } }, 'Borrar'),
          ]))));
    return cont;
  }

  async function pintarImagenes(main) {
    const zona = h('div');
    const refrescar = async () => zona.replaceChildren(await galeria(refrescar));
    main.append(
      h('p', { class: 'pista', style: 'color:var(--muted)' }, 'Las imágenes se convierten a WebP en tu navegador y se guardan en src/assets/img/ y Astro las optimiza otra vez al compilar (varios tamaños). En los campos de imagen usa la ruta /img/nombre.webp (el panel la copia por ti).'),
      subidor(refrescar), h('h3', {}, 'Tus imágenes'), zona);
    await refrescar();
  }

  // Ventana para elegir una imagen desde un campo (avatar, imagen al compartir…)
  function elegirImagen(cb) {
    const d = h('dialog', { style: 'width:min(760px,calc(100vw - 32px))' });
    const zona = h('div');
    const cerrar = () => { d.close(); d.remove(); };
    const elegir = (url) => { cb(url); cerrar(); };
    const refrescar = async () => zona.replaceChildren(await galeria(refrescar, elegir));
    d.append(h('h3', {}, 'Elegir imagen'), subidor((ok) => { refrescar(); if (ok.length === 1) elegir(ok[0].guardada); }), zona,
      h('div', { class: 'botones' }, h('button', { class: 'btn', onclick: cerrar }, 'Cancelar')));
    document.body.append(d);
    d.showModal();
    refrescar();
  }

  // -------------------------------------------------------------- ÍCONOS
  async function pintarIconos(main) {
    const { iconos, usos } = await api('iconos');
    let original = JSON.stringify(iconos);
    let sel = null;
    const zona = h('div');
    const svgDe = (nombre, c, clase = 'svgprev') => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', clase);
      s.innerHTML = c; // solo contenido que tú escribes en tu propio panel
      return s;
    };
    const limpiar = (txt) => {
      txt = txt.trim();
      if (/<svg[\s>]/i.test(txt)) {
        const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        if (doc.querySelector('parsererror')) throw new Error('Ese SVG no es válido.');
        doc.querySelectorAll('script,style,foreignObject').forEach((n) => n.remove());
        return new XMLSerializer().serializeToString(doc.documentElement).replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/ xmlns="[^"]*"/g, '').trim();
      }
      return txt;
    };
    const guardarTodo = async () => {
      try {
        await api('iconos', 'POST', { iconos });
        original = JSON.stringify(iconos);
        P.setIconos(Object.keys(iconos));
        aviso('Íconos guardados en src/lib/iconos.js');
        pintar();
      } catch (e) { aviso(e.message, true); }
    };

    const pintar = () => {
      const sucio = JSON.stringify(iconos) !== original;
      const rej = h('div', { class: 'icos' }, Object.entries(iconos).map(([k, c]) =>
        h('button', { class: k === sel ? 'sel' : '', type: 'button', onclick: () => { sel = k; pintar(); } }, svgDe(k, c), k)));
      zona.replaceChildren(
        h('div', { class: 'opts' },
          h('button', { class: 'btn', onclick: () => { sel = '__nuevo'; pintar(); } }, '+ Agregar ícono'),
          h('button', { class: 'btn primario', disabled: !sucio, onclick: guardarTodo }, sucio ? 'Guardar íconos' : 'Íconos guardados'),
          sucio && h('button', { class: 'btn', onclick: () => { Object.keys(iconos).forEach((k) => delete iconos[k]); Object.assign(iconos, JSON.parse(original)); sel = null; pintar(); } }, 'Deshacer')),
        rej, editor());
    };

    const editor = () => {
      if (!sel) return h('p', { class: 'vacio' }, 'Elige un ícono para editarlo o pulsa "+ Agregar ícono".');
      const nuevo = sel === '__nuevo';
      const nombre = h('input', { type: 'text', value: nuevo ? '' : sel, placeholder: 'nombre-en-minusculas', disabled: !nuevo });
      const cod = h('textarea', { rows: 6, spellcheck: 'false', placeholder: '<path d="M12 5v14M5 12h14" />   (o pega un <svg> completo)' }, nuevo ? '' : iconos[sel]);
      cod.value = nuevo ? '' : iconos[sel];
      const prev = h('div', { style: 'min-width:70px' });
      const ver = () => { try { prev.replaceChildren(svgDe('x', limpiar(cod.value), 'svgprev grande')); } catch { prev.textContent = '⚠'; } };
      cod.oninput = ver; ver();
      const archivo = h('input', { type: 'file', accept: '.svg,image/svg+xml', onchange: async (e) => { const f = e.target.files[0]; if (f) { cod.value = await f.text(); try { cod.value = limpiar(cod.value); } catch (er) { aviso(er.message, true); } ver(); } } });
      const aplicar = () => {
        const k = nuevo ? slug(nombre.value) : sel;
        if (!/^[a-z0-9][a-z0-9-]*$/.test(k)) return aviso('Pon un nombre en minúsculas, números y guiones.', true);
        if (nuevo && iconos[k]) return aviso('Ya existe un ícono con ese nombre.', true);
        let c;
        try { c = limpiar(cod.value); } catch (e) { return aviso(e.message, true); }
        if (!c) return aviso('El ícono está vacío.', true);
        iconos[k] = c; sel = k; pintar();
      };
      const u = nuevo ? [] : usos[sel] ?? [];
      return h('div', { class: 'caja' },
        h('h3', {}, nuevo ? 'Nuevo ícono' : 'Editar: ' + sel),
        h('div', { class: 'opts' }, h('label', {}, 'Nombre', nombre), prev, h('label', {}, 'Cargar archivo .svg', archivo)),
        h('div', { class: 'pista', style: 'color:var(--muted);font-size:.82rem' }, 'Se dibuja en una caja de 24×24 con trazo (stroke) del color del texto. Si el SVG trae width/height o fill fijos, quedan; lo ideal son íconos "de línea".'),
        cod,
        h('div', { class: 'opts' },
          h('button', { class: 'btn primario', onclick: aplicar }, nuevo ? 'Agregar a la lista' : 'Aplicar cambios'),
          !nuevo && h('button', { class: 'btn peligro', onclick: () => {
            if (!confirm(`¿Borrar el ícono "${sel}"?` + (u.length ? `\n\nSe usa en: ${u.join(', ')}. Ahí dejará de verse.` : ''))) return;
            delete iconos[sel]; sel = null; pintar();
          } }, 'Borrar'),
          !nuevo && u.length > 0 && h('span', { style: 'color:var(--muted)' }, 'Usado en ' + u.length + ' archivo(s)')));
    };
    main.append(h('p', { class: 'pista', style: 'color:var(--muted)' }, 'Los cambios se escriben en src/lib/iconos.js al pulsar "Guardar íconos" (no dependen del botón Guardar de arriba).'), zona);
    pintar();
  }

  // -------------------------------------------------------------- FUENTES
  const ROLES = [['principal', 'Principal', 'sans-serif'], ['manuscrita', 'Manuscrita', 'cursive'], ['pixel', 'Pixel', 'monospace'], ['mono', 'Mono', 'monospace']];

  async function pintarFuentes(main) {
    const zona = h('div');
    const familia = h('input', { type: 'text', placeholder: 'Ej: Plus Jakarta Sans' });
    const peso = h('select', {}, [400, 500, 600, 700, 800, 900, 300, 200, 100].map((p) => h('option', { value: p }, p)));
    const estilo = h('select', {}, h('option', { value: 'normal' }, 'normal'), h('option', { value: 'italic' }, 'cursiva'));
    const archivo = h('input', { type: 'file', accept: '.woff2,.woff,.ttf,.otf', onchange: () => { const f = archivo.files[0]; if (f && !familia.value) familia.value = quitarExt(f.name).replace(/[-_](regular|bold|italic|medium|light|\d+)$/i, '').replace(/[-_]/g, ' '); } });
    const subir = h('button', { class: 'btn primario', onclick: async () => {
      const f = archivo.files[0];
      if (!f) return aviso('Elige un archivo de fuente.', true);
      try {
        await api('fuentes', 'POST', { archivo: f.name, datos: await leerB64(f), familia: familia.value, peso: peso.value, estilo: estilo.value });
        aviso('Fuente guardada en src/fonts'); archivo.value = ''; refrescar();
      } catch (e) { aviso(e.message, true); }
    } }, 'Guardar en src/fonts');

    const refrescar = async () => {
      const { fuentes, importado } = await api('fuentes');
      const fams = [...new Set(fuentes.map((f) => f.familia))];
      zona.replaceChildren(
        !importado && h('div', { class: 'aviso' }, h('p', {}, 'Base.astro todavía no importa src/styles/fuentes.css: añade  import \'../styles/fuentes.css\';  junto a los otros imports de estilos.')),
        h('h3', {}, 'Fuentes instaladas'),
        fams.length ? fams.map((fam) => h('div', { class: 'caja' },
          h('b', { style: `font-family:'${fam}'` }, `${fam} — The quick brown fox 123`),
          fuentes.filter((f) => f.familia === fam).map((f) => h('div', { class: 'opts' },
            h('span', {}, `${f.archivo} · peso ${f.peso}${f.estilo === 'italic' ? ' · cursiva' : ''}${f.existe ? '' : ' · ⚠ archivo no encontrado'}`),
            h('button', { class: 'btn mini peligro', onclick: async () => { if (!confirm('¿Borrar ' + f.archivo + '?')) return; try { await api('fuentes/borrar', 'POST', { archivo: f.archivo }); refrescar(); } catch (e) { aviso(e.message, true); } } }, 'Borrar'))),
          h('div', { class: 'opts' }, 'Usar como:', ROLES.map(([rol, et, resp]) => h('button', { class: 'btn mini', onclick: () => {
            P.estado.fuentes[rol] = `'${fam}', ${resp}`; P.cambio(); aviso(`Fuente ${et}: ${fam} (recuerda Guardar)`);
          } }, et))))) : h('p', { class: 'vacio' }, 'Aún no hay fuentes en src/fonts.'),
        h('div', { class: 'caja' }, h('h3', {}, 'Quitar Google Fonts'),
          h('p', { class: 'pista', style: 'color:var(--muted)' }, 'Cuando todas tus fuentes estén aquí, vacía el enlace de Google para que el sitio no se conecte a sus servidores.'),
          h('button', { class: 'btn', onclick: () => { P.estado.fuentes.url = ''; P.cambio(); aviso('Enlace de Google Fonts vaciado (recuerda Guardar)'); } }, 'Vaciar enlace de Google Fonts')));
    };
    main.append(
      h('p', { class: 'pista', style: 'color:var(--muted)' }, 'Descarga la fuente (woff2 es lo mejor) y súbela aquí: se copia a src/fonts/ y se registra en src/styles/fuentes.css. Después pulsa "Usar como…" para asignarla.'),
      h('div', { class: 'caja' }, h('h3', {}, 'Agregar fuente'),
        h('div', { class: 'opts' }, archivo, h('label', {}, 'Familia', familia), h('label', {}, 'Peso', peso), h('label', {}, 'Estilo', estilo)), subir),
      zona);
    await refrescar();
  }

  // -------------------------------------------- Acentos (sección "Colores")
  const luz = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const auto = (hex) => (luz(hex) > 0.18 ? '#121212' : '#ffffff');
  const PROTEGIDOS = ['amarillo', 'verde', 'rosa', 'azul', 'naranja', 'morado']; // los usa el diseño en el CSS
  const HEX = /^#[0-9a-f]{6}$/i;

  function acentos(main) {
    const t = P.estado.tema;
    const zona = h('div', { class: 'caja' }, h('h3', {}, 'Colores de acento y color de su texto'));
    const pintar = () => {
      zona.replaceChildren(h('h3', {}, 'Colores de acento y color de su texto'),
        h('p', { class: 'pista', style: 'color:var(--muted);font-size:.85rem;margin:0 0 6px' }, 'El "texto sobre el acento" es el de las insignias, resaltados y botones que usan ese color. En automático se elige negro o blanco según el brillo.'),
        ...Object.entries(t.acentos).map(([k, v]) => {
          const manual = t.textoAcento?.[k];
          const col = manual || auto(v);
          const fijar = (x) => { t.textoAcento ??= {}; if (x) t.textoAcento[k] = x; else delete t.textoAcento[k]; P.cambio(); pintar(); };
          const hex = h('input', { type: 'text', value: v }), pick = h('input', { type: 'color', value: v, 'aria-label': 'Color' });
          const muestra = h('div', { class: 'muestra', style: `background:${v};color:${col}` }, 'Aa');
          const set = (x) => { if (!HEX.test(x)) return; t.acentos[k] = x; P.cambio(); pintar(); };
          pick.addEventListener('change', () => set(pick.value));
          hex.addEventListener('change', () => set(hex.value));
          const tp = h('input', { type: 'color', value: col, 'aria-label': 'Color del texto' });
          tp.addEventListener('change', () => fijar(tp.value));
          const usos = [...Object.values(P.estado.categorias ?? {}), ...(P.estado.hero?.insignias ?? [])].filter((x) => x.color === k).length;
          return h('div', { class: 'acento' }, muestra, h('b', {}, k),
            h('div', {},
              h('div', { class: 'colores' }, pick, hex),
              h('div', { class: 'txtc' }, 'Texto:', tp, manual ? h('button', { class: 'btn mini', onclick: () => fijar(null) }, 'Volver a automático') : h('span', { style: 'color:var(--muted)' }, 'automático'))),
            PROTEGIDOS.includes(k)
              ? h('span', { style: 'color:var(--muted);font-size:.78rem', title: 'El diseño usa este color en varios sitios' }, 'base')
              : h('button', { class: 'btn mini peligro', onclick: () => {
                if (usos && !confirm(`"${k}" lo usan ${usos} categoría(s)/insignia(s). ¿Borrar igual? Tendrás que cambiarles el color.`)) return;
                delete t.acentos[k]; if (t.textoAcento) delete t.textoAcento[k]; P.cambio(); pintar();
              } }, 'Borrar'));
        }),
        h('button', { class: 'btn mini', onclick: () => {
          const n = (prompt('Nombre del nuevo color (minúsculas, sin espacios ni tildes, ej: turquesa):') || '').trim();
          if (!n) return;
          if (!/^[a-z][a-z0-9-]*$/.test(n)) return aviso('Usa minúsculas, números y guiones.', true);
          if (t.acentos[n]) return aviso('Ese nombre ya existe.', true);
          t.acentos[n] = '#22d3ee'; P.cambio(); pintar();
        } }, '+ Agregar color'));
    };
    pintar();
    main.append(zona);
  }

  // ------------------------ Colores de elementos sueltos (tema.elementos)
  const ELEMENTOS = [
    ['progreso', 'Barra de progreso de lectura', 'rosa'],
    ['indiceActivo', 'Índice del artículo: línea del capítulo activo', 'rosa'],
    ['menuActivo', 'Menú: subrayado de la página actual', 'amarillo'],
    ['enlaces', 'Enlaces dentro del texto', 'azul'],
    ['cita', 'Borde de las citas', 'amarillo'],
    ['foco', 'Contorno al enfocar (buscadores, teclado)', 'azul'],
    ['sombraBoton', 'Sombra del botón principal', 'amarillo'],
    ['sombraAutor', 'Sombra de la caja "Quién escribe"', 'verde'],
    ['sombraNewsletter', 'Sombra de la caja de newsletter', 'rosa'],
    ['resultados', 'Línea de los resultados de búsqueda', 'amarillo'],
    ['novelaDestaque', 'Novela: nombre del personaje y aro del quicktime', 'amarillo'],
  ];

  function elementos(main) {
    const t = P.estado.tema;
    const zona = h('div', { class: 'caja' });
    const pintar = () => {
      const nombres = Object.keys(t.acentos);
      zona.replaceChildren(h('h3', {}, 'Colores de elementos'),
        h('p', { class: 'pista', style: 'color:var(--muted);font-size:.85rem;margin:0 0 6px' }, 'Elige un acento o un color propio para cada detalle. "Original" deja el color de siempre. Los bordes generales (tarjetas, cajas) se cambian abajo en Modo claro / oscuro → Borde.'),
        ...ELEMENTOS.map(([k, et, def]) => {
          const v = t.elementos?.[k];
          const propio = typeof v === 'string' && v.startsWith('#');
          const fijar = (x) => { t.elementos ??= {}; if (x) t.elementos[k] = x; else delete t.elementos[k]; P.cambio(); pintar(); };
          const sel = h('select', { onchange: (e) => {
            const x = e.target.value;
            if (x === '') fijar(null); else if (x === '__propio') fijar(HEX.test(t.acentos[v] ?? '') ? t.acentos[v] : '#ff5555'); else fijar(x);
          } },
          h('option', { value: '', selected: !v }, `Original (${def})`),
          nombres.map((n) => h('option', { value: n, selected: v === n }, n)),
          h('option', { value: '__propio', selected: propio }, 'Color propio…'));
          const color = propio ? h('input', { type: 'color', value: v, onchange: (e) => fijar(e.target.value) }) : null;
          const mostrado = propio ? v : t.acentos[v || def];
          return h('div', { class: 'opts', style: 'border-bottom:1px dashed var(--line);padding:6px 0;justify-content:space-between' },
            h('span', { style: 'flex:1;min-width:200px' }, et),
            h('span', { style: `width:22px;height:22px;border-radius:50%;border:2px solid var(--line);background:${mostrado ?? 'transparent'}` }),
            sel, color);
        }));
    };
    pintar();
    main.append(zona);
  }

  window.Assets = {
    elegirImagen,
    pintar(seccion, main) {
      if (seccion === '_imagenes') return pintarImagenes(main);
      if (seccion === '_iconos') return pintarIconos(main);
      if (seccion === '_fuentes') return pintarFuentes(main);
    },
    extras(seccion, main) {
      if (seccion === 'tema') { acentos(main); elementos(main); }
      if (seccion === 'home') main.append(h('p', { class: 'pista', style: 'color:var(--muted)' }, 'Para cambiar el lugar de cada sección usa la lista "Orden de las secciones" (flechas ↑ ↓). Las secciones que quites de la lista van al final.'));
    },
  };
})();
