// ============================================================================
//  novela.js — Motor de la novela gráfica animada
//  Cada escena es una imagen grande fijada en pantalla; al hacer scroll la
//  "cámara" viaja de plano en plano (zoom + paneo), aparecen los textos y,
//  si el plano lo pide, se frena el scroll para un quicktime event.
// ============================================================================
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FASE = 0.35; // parte del plano que dura el viaje de cámara (el resto es pausa)
const DERIVA = 0.03; // acercamiento lento mientras el plano está quieto
const QTE_DESDE = 0.6; // en qué punto del plano arranca el quicktime event
const FUNDIDO = 0.35; // pantallas que dura el fundido de entrada y salida

export function iniciarNovelas() {
  const cont = document.querySelector('[data-novela]');
  if (!cont) return;
  cont.classList.add('nv-js');
  const escenas = [...cont.querySelectorAll('[data-escena]')].map((sec, i) => montar(sec, i === 0, cont.dataset));

  let pendiente = false;
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      escenas.forEach((e) => e.actualizar());
    });
  };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', () => {
    escenas.forEach((e) => e.medir());
    pedir();
  });
  pedir();
}

function montar(sec, primera, textos) {
  const plan = JSON.parse(sec.dataset.plan);
  const esc = sec.querySelector('.nv-escenario');
  const fondo = sec.querySelector('.nv-fondo');
  const capas = [...sec.querySelectorAll('.nv-capa')];
  const velo = sec.querySelector('.nv-velo');
  const pista = sec.querySelector('.nv-pista');
  const qteEl = sec.querySelector('.nv-qte');
  const lineas = [...sec.querySelectorAll('.nv-texto')].map((el) => ({
    el,
    plano: Number(el.dataset.plano),
    orden: Number(el.dataset.orden),
    si: el.dataset.si || '',
    txt: el.querySelector('.nv-txt'),
    completo: el.querySelector('.nv-txt').dataset.texto,
    timer: null,
    visible: false,
  }));

  const planos = plan.planos;
  let acc = 0;
  for (const p of planos) {
    p.dur = p.duracion || 1;
    p.ini = acc;
    acc += p.dur;
  }
  const total = acc;
  sec.style.setProperty('--nv-total', total);

  let W = 1, H = 1, iw = 1, ih = 1;
  let actual = -1;

  // ---------- Medidas y encuadre de cada plano ----------
  function medir() {
    W = esc.clientWidth;
    H = esc.clientHeight;
    iw = fondo.naturalWidth || 1;
    ih = fondo.naturalHeight || 1;
    for (const el of [fondo, ...capas]) {
      el.style.width = iw + 'px'; // las capas se ajustan al tamaño del fondo
      el.style.height = ih + 'px';
    }
    const cubrir = Math.max(W / iw, H / ih); // escala con la que la imagen llena la pantalla
    const caber = Math.min(W / iw, H / ih); // escala con la que se ve la imagen entera
    for (const p of planos) {
      let cx, cy, s;
      if (p.panel) {
        const [x, y, w, h] = p.panel;
        cx = ((x + w / 2) / 100) * iw;
        cy = ((y + h / 2) / 100) * ih;
        s = Math.min(W / ((w / 100) * iw), H / ((h / 100) * ih)) * 0.96;
      } else {
        const f = p.foco || { x: 50, y: 50, zoom: 1 };
        cx = (f.x / 100) * iw;
        cy = (f.y / 100) * ih;
        s = cubrir * (f.zoom || 1);
      }
      // un panel puede verse entero aunque sobre fondo alrededor; un foco nunca deja ver fuera de la imagen
      p.enc = { cx, cy, s: Math.max(s, p.panel ? caber : cubrir) };
    }
  }

  // ---------- Cámara ----------
  const mezcla = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: lerp(a.s, b.s, t) });

  function camaraEn(t) {
    let i = planos.findIndex((p) => t < p.ini + p.dur);
    if (i < 0) i = planos.length - 1;
    const p = planos[i];
    const u = clamp((t - p.ini) / p.dur, 0, 1);
    if (REDUCIR) return { c: p.enc, i, u };
    const hayViaje = i > 0;
    const fase = hayViaje ? FASE : 0;
    let c;
    if (hayViaje && u < fase) {
      const ant = planos[i - 1].enc;
      c = mezcla({ ...ant, s: ant.s * (1 + DERIVA) }, p.enc, ease(u / fase));
    } else {
      c = { ...p.enc, s: p.enc.s * (1 + DERIVA * ((u - fase) / (1 - fase))) };
    }
    return { c, i, u };
  }

  function colocar(el, cx, cy, s) {
    // no dejar ver fuera de la imagen
    const mx = W / (2 * s), my = H / (2 * s);
    cx = iw * s <= W ? iw / 2 : clamp(cx, mx, iw - mx);
    cy = ih * s <= H ? ih / 2 : clamp(cy, my, ih - my);
    el.style.transform = `translate3d(${W / 2 - cx * s}px, ${H / 2 - cy * s}px, 0) scale(${s})`;
  }

  function aplicar(c) {
    colocar(fondo, c.cx, c.cy, c.s);
    for (const capa of capas) colocar(capa, c.cx, c.cy, c.s * (1 + (Number(capa.dataset.prof) || 0) * 0.25));
  }

  // ---------- Textos ----------
  function mostrar(l, on) {
    if (l.visible === on) return;
    l.visible = on;
    l.el.classList.toggle('visible', on);
    clearInterval(l.timer);
    l.txt.textContent = l.completo;
    if (on && !REDUCIR && l.el.classList.contains('nv-voz')) {
      let n = 0;
      l.txt.textContent = '';
      l.timer = setInterval(() => {
        n += 1;
        l.txt.textContent = l.completo.slice(0, n);
        if (n >= l.completo.length) clearInterval(l.timer);
      }, 22);
    }
  }

  function actualizarTextos(i, u) {
    const p = planos[i];
    const base = i > 0 ? FASE * 0.7 : 0.08;
    for (const l of lineas) {
      let on = l.plano === i && u >= base + l.orden * 0.16;
      if (on && l.si) on = p.resultado === l.si;
      mostrar(l, on);
    }
  }

  // ---------- Efectos ----------
  function entrarPlano(i) {
    const p = planos[i];
    esc.dataset.efecto = '';
    if (p.efecto && !REDUCIR) {
      void esc.offsetWidth; // reinicia la animación
      esc.dataset.efecto = p.efecto;
    }
  }

  // ---------- Quicktime event ----------
  let bloqueo = null;
  const nombreTecla = (t) => (t === 'espacio' ? ' ' : String(t).toLowerCase());

  function bloquearScroll(si) {
    document.documentElement.classList.toggle('nv-bloqueado', si);
  }

  function iniciarQte(p) {
    if (REDUCIR) {
      p.resuelto = true;
      p.resultado = 'exito';
      return;
    }
    bloqueo = p;
    bloquearScroll(true);
    const q = p.qte;
    qteEl.hidden = false;
    qteEl.dataset.res = '';
    qteEl.querySelector('.nv-qte-texto').textContent = q.texto || '';
    qteEl.querySelector('.nv-qte-res').textContent = '';
    qteEl.querySelector('.nv-qte-tecla').textContent = q.etiqueta || (q.tecla === 'espacio' ? 'ESPACIO' : String(q.tecla).toUpperCase());
    qteEl.style.setProperty('--tiempo', q.tiempo + 's');
    qteEl.classList.remove('corre');
    void qteEl.offsetWidth;
    qteEl.classList.add('corre');

    const objetivo = nombreTecla(q.tecla);
    let cerrado = false;
    const fin = (ok) => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(reloj);
      removeEventListener('keydown', alTeclear);
      boton.removeEventListener('click', alTocar);
      qteEl.classList.remove('corre');
      qteEl.dataset.res = ok ? 'ok' : 'mal';
      qteEl.querySelector('.nv-qte-res').textContent = ok ? textos.bien : textos.mal;
      if (navigator.vibrate) navigator.vibrate(ok ? 30 : [60, 40, 60]);
      if (!ok) {
        esc.dataset.efecto = '';
        void esc.offsetWidth;
        esc.dataset.efecto = 'rojo';
      }
      setTimeout(() => {
        if (!ok && q.obligatorio) {
          bloqueo = null;
          iniciarQte(p); // se repite
          return;
        }
        p.resuelto = true;
        p.resultado = ok ? 'exito' : 'fallo';
        qteEl.hidden = true;
        bloqueo = null;
        bloquearScroll(false);
        actualizarTextos(actual, 1);
      }, 800);
    };
    const alTeclear = (e) => {
      if (e.key === objetivo || (objetivo === ' ' && e.code === 'Space')) {
        e.preventDefault();
        fin(true);
      }
    };
    const alTocar = () => fin(true);
    const boton = qteEl.querySelector('.nv-qte-btn');
    addEventListener('keydown', alTeclear);
    boton.addEventListener('click', alTocar);
    const reloj = setTimeout(() => fin(false), q.tiempo * 1000);
  }

  // ---------- Cada fotograma ----------
  function actualizar() {
    const r = sec.getBoundingClientRect();
    if (r.bottom < -H * 0.5 || r.top > H * 1.5) return; // fuera de pantalla
    const t = -r.top / H; // 0 = la escena se acaba de fijar; total = se va a soltar
    const { c, i, u } = camaraEn(clamp(t, 0, total));
    aplicar(c);

    // fundido de entrada y salida
    let v = 0;
    if (plan.entrada !== 'corte') v = Math.max(v, clamp(1 - t / FUNDIDO, 0, 1));
    if (plan.salida !== 'corte') v = Math.max(v, clamp((t - (total - FUNDIDO)) / FUNDIDO, 0, 1));
    velo.style.opacity = v;
    velo.style.background = (t < total / 2 ? plan.entrada : plan.salida) === 'blanco' ? '#fff' : '#000';

    if (pista) pista.classList.toggle('ver', t >= 0 && t < 0.25);

    if (t >= 0 && t <= total) {
      if (i !== actual) {
        actual = i;
        entrarPlano(i);
      }
      actualizarTextos(i, u);
      const p = planos[i];
      if (p.qte && !p.resuelto && !bloqueo && u >= QTE_DESDE) iniciarQte(p);
    } else {
      lineas.forEach((l) => mostrar(l, false));
      actual = -1;
    }
  }

  // ---------- Arranque ----------
  const iniciar = () => {
    medir();
    actualizar();
  };
  if (fondo.complete && fondo.naturalWidth) iniciar();
  fondo.addEventListener('load', iniciar);
  return { medir, actualizar };
}
