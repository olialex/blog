// Visor de fotos (estilo Google Fotos, sin editor). Sin librerías.
//  - Velocidad: se precargan la foto siguiente y la anterior; mientras llega una foto se ve un recuadro del color promedio.
//    Además se precargan la siguiente y la anterior.
//  - Zoom: rueda del ratón, botones +/−, teclas + − 0, doble clic/toque y pellizco con dos dedos.
//  - Mover la foto con zoom: arrastrando (dedo o ratón), manteniendo ESPACIO + arrastrar, o con las flechas.
//  - Solo se cierra con la X o con Esc.
const el = document.getElementById('visor');
const dato = document.getElementById('galeria-datos');
if (el && dato) {
  const fotos = JSON.parse(dato.textContent || '[]');
  const $ = (s) => el.querySelector(s);
  const escena = $('.visor-escena'), pista = $('.visor-pista'), img = $('.visor-img'), cuenta = $('.visor-cuenta'), aviso = $('.visor-aviso');
  const ids = fotos.map((f) => f.id);
  const MAX = 8;
  const cache = new Map();
  let actual = -1, abierto = false;
  let S = 1, TX = 0, TY = 0, FIT = 1, mano = false;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- tamaño y zoom ----------
  function limitar() {
    const f = fotos[actual]; if (!f) return;
    const mx = Math.max(0, (f.w * FIT * S - escena.clientWidth) / 2);
    const my = Math.max(0, (f.h * FIT * S - escena.clientHeight) / 2);
    TX = clamp(TX, -mx, mx); TY = clamp(TY, -my, my);
  }
  function aplicar() {
    limitar();
    const t = `translate(${TX}px, ${TY}px) scale(${S})`;
    img.style.transform = t;
    escena.classList.toggle('con-zoom', S > 1.001);
  }
  function ajustar() { // la foto entera dentro de la pantalla
    const f = fotos[actual]; if (!f || !abierto) return;
    FIT = Math.min((escena.clientWidth - 24) / f.w, (escena.clientHeight - 24) / f.h);
    const w = f.w * FIT, h = f.h * FIT;
    for (const i of [img]) Object.assign(i.style, { width: w + 'px', height: h + 'px', marginLeft: -w / 2 + 'px', marginTop: -h / 2 + 'px' });
    aplicar();
  }
  function zoomEn(nuevo, cx = 0, cy = 0) { // cx, cy: punto respecto al centro de la escena (el punto bajo el cursor se queda quieto)
    nuevo = clamp(nuevo, 1, MAX);
    const k = nuevo / S;
    TX = cx - (cx - TX) * k; TY = cy - (cy - TY) * k; S = nuevo;
    if (S < 1.001) { S = 1; TX = TY = 0; }
    aplicar();
  }
  const centro = (e) => { const r = escena.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };

  // ---------- mostrar fotos ----------
  const precargar = (i) => {
    const f = fotos[i];
    if (f && !cache.has(f.id)) { const im = new Image(); im.decoding = 'async'; im.src = f.g; cache.set(f.id, im); }
  };
  function mostrar(i) {
    const f = fotos[i]; if (!f) return;
    actual = i; S = 1; TX = TY = 0;
    // Sin miniatura borrosa: mientras llega la foto se ve un recuadro del color promedio, y la foto aparece de golpe cuando está lista
    img.removeAttribute('src'); img.alt = ''; img.style.background = f.c || '#222';
    precargar(i);
    const im = cache.get(f.id);
    const poner = () => { if (fotos[actual] !== f) return; img.src = f.g; img.alt = f.t || ''; img.style.background = ''; };
    if (im.complete && im.naturalWidth) poner(); else im.addEventListener('load', poner, { once: true });
    ajustar();
    cuenta.textContent = `${i + 1} / ${fotos.length}`;
    $('.visor-titulo').textContent = f.t || 'Sin título';
    $('.visor-fecha').textContent = f.f ? new Date(f.f + 'T12:00:00').toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    $('.visor-desc').innerHTML = f.d || '';
    const etq = $('.visor-etq'); etq.textContent = '';
    for (const e of f.e || []) { const s = document.createElement('span'); s.className = 'tag'; s.textContent = e; etq.append(s); }
    $('.visor-ant').hidden = i === 0; $('.visor-sig').hidden = i === fotos.length - 1;
    precargar(i + 1); precargar(i - 1);
  }
  function abrir(i) {
    if (!abierto) {
      abierto = true; el.hidden = false; document.documentElement.classList.add('visor-abierto');
    }
    mostrar(i);
  }
  function cerrarVista() {
    if (!abierto) return;
    abierto = false; el.hidden = true; document.documentElement.classList.remove('visor-abierto');
    img.removeAttribute('src');
    const a = document.querySelector(`.foto[data-i="${actual}"]`);
    a?.focus({ preventScroll: true }); a?.scrollIntoView({ block: 'nearest' });
  }
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');
  const irA = (i) => {
    if (i < 0 || i >= fotos.length || i === actual) return;
    const dir = i > actual ? 1 : -1;
    history.replaceState({ visor: 1 }, '', '#' + ids[i]);
    if (reducir.matches) { mostrar(i); return; }
    // la foto que sale se queda como "fantasma" y se desliza mientras entra la nueva (sin saltos de tamaño)
    const g = pista.cloneNode(true);
    g.classList.add('visor-fantasma');
    escena.append(g);
    g.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 70}px)`, opacity: 0 }], { duration: 240, easing: 'ease-in' }).onfinish = () => g.remove();
    mostrar(i);
    pista.animate([{ transform: `translateX(${dir * 70}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
  };
  const cerrar = () => {
    if (history.state?.visor) history.back();
    else { history.replaceState(null, '', location.pathname + location.search); cerrarVista(); }
  };
  const segunHash = () => {
    const i = ids.indexOf(decodeURIComponent(location.hash.slice(1)));
    if (i >= 0) abrir(i); else cerrarVista();
  };

  // ---------- compartir ----------
  let t;
  const decir = (m) => { aviso.textContent = m; aviso.hidden = false; clearTimeout(t); t = setTimeout(() => (aviso.hidden = true), 2000); };
  async function compartir() {
    const f = fotos[actual];
    const url = location.origin + location.pathname + '#' + f.id;
    if (navigator.share) { try { await navigator.share({ title: f.t || document.title, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); decir('Enlace copiado'); } catch { prompt('Copia el enlace:', url); }
  }

  // ---------- eventos ----------
  document.querySelectorAll('.foto').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      history.pushState({ visor: 1 }, '', '#' + ids[Number(a.dataset.i)]);
      abrir(Number(a.dataset.i));
    }),
  );
  addEventListener('popstate', segunHash);
  addEventListener('hashchange', segunHash);
  addEventListener('resize', ajustar);
  new ResizeObserver(ajustar).observe(escena);

  const movil = matchMedia('(max-width: 899px)');
  el.addEventListener('click', (e) => {
    // en el móvil, tocar fuera de la hoja de información la cierra
    if (movil.matches && el.classList.contains('con-info') && !e.target.closest('.visor-info, [data-v]')) { el.classList.remove('con-info'); return; }
    const v = e.target.closest('[data-v]')?.dataset.v;
    if (v === 'cerrar') cerrar();
    else if (v === 'ant') irA(actual - 1);
    else if (v === 'sig') irA(actual + 1);
    else if (v === 'info') { el.classList.toggle('con-info'); requestAnimationFrame(ajustar); }
    else if (v === 'compartir') compartir();
    else if (v === 'mas') zoomEn(S * 1.5);
    else if (v === 'menos') zoomEn(S / 1.5);
  });

  addEventListener('keydown', (e) => {
    if (!abierto) return;
    const k = e.key;
    if (k === 'Escape') { cerrar(); return; }
    if (k === ' ') { e.preventDefault(); if (!mano) { mano = true; escena.classList.add('mano'); } return; }
    if (k === '+' || k === '=') zoomEn(S * 1.5);
    else if (k === '-' || k === '_') zoomEn(S / 1.5);
    else if (k === '0') zoomEn(1);
    else if (k === 'i') { el.classList.toggle('con-info'); requestAnimationFrame(ajustar); }
    else if (k.startsWith('Arrow')) {
      if (S > 1) { e.preventDefault(); const p = 90; if (k === 'ArrowLeft') TX += p; if (k === 'ArrowRight') TX -= p; if (k === 'ArrowUp') TY += p; if (k === 'ArrowDown') TY -= p; aplicar(); }
      else if (k === 'ArrowLeft') irA(actual - 1);
      else if (k === 'ArrowRight') irA(actual + 1);
    }
  });
  addEventListener('keyup', (e) => { if (e.key === ' ') { mano = false; escena.classList.remove('mano'); } });
  addEventListener('blur', () => { mano = false; escena.classList.remove('mano'); });

  // rueda del ratón (y pellizco del trackpad) = zoom en el punto del cursor
  escena.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [cx, cy] = centro(e);
    zoomEn(S * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), cx, cy);
  }, { passive: false });
  escena.addEventListener('dblclick', (e) => { const [cx, cy] = centro(e); zoomEn(S > 1 ? 1 : 2.5, cx, cy); });

  // arrastrar y pellizcar (dedo o ratón)
  const punteros = new Map();
  let d0 = 0, inicio = null, ultimoToque = 0, mov = 0;
  escena.addEventListener('pointerdown', (e) => {
    escena.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.size === 2) { const [a, b] = [...punteros.values()]; d0 = Math.hypot(a.x - b.x, a.y - b.y); }
    if (punteros.size === 1) { inicio = { x: e.clientX, y: e.clientY }; mov = 0; }
  });
  escena.addEventListener('pointermove', (e) => {
    const p = punteros.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    mov += Math.abs(dx) + Math.abs(dy);
    if (punteros.size === 2) {
      const [a, b] = [...punteros.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = escena.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - r.left - r.width / 2, cy = (a.y + b.y) / 2 - r.top - r.height / 2;
      if (d0) zoomEn(S * (d / d0), cx, cy);
      d0 = d;
    } else if (S > 1 || (mano && e.pointerType === 'mouse')) {
      TX += dx; TY += dy; aplicar();
    }
  });
  const soltar = (e) => {
    const p = punteros.get(e.pointerId); if (!p) return;
    punteros.delete(e.pointerId);
    if (punteros.size === 0 && inicio && e.pointerType !== 'mouse' && e.type === 'pointerup') {
      const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
      if (S === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irA(actual + (dx < 0 ? 1 : -1)); // deslizar = siguiente / anterior
      else if (mov < 12) { // toque corto: doble toque = zoom
        const ahora = Date.now();
        if (ahora - ultimoToque < 320) { const [cx, cy] = centro(e); zoomEn(S > 1 ? 1 : 2.5, cx, cy); ultimoToque = 0; } else ultimoToque = ahora;
      }
    }
    if (punteros.size === 0) inicio = null;
  };
  escena.addEventListener('click', (e) => {
    if (mov >= 12 || (movil.matches && el.classList.contains('con-info'))) return;
    const r = img.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return; // sobre la foto no cambia
    const m = escena.getBoundingClientRect();
    irA(actual + (e.clientX > m.left + m.width / 2 ? 1 : -1));
  });
  escena.addEventListener('pointerup', soltar);
  escena.addEventListener('pointercancel', soltar);

  if (location.hash) segunHash();
}
