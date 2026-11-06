// ============================================================================
//  continuar.js — recuerda (en localStorage) hasta dónde leíste cada página
//  Muestra un botón redondo abajo a la derecha:
//   · En un artículo con avance guardado: se despliega "Continuar", y si no lo usas desaparece.
//   · En el inicio (si hay algo a medias): se despliega "Continuar", se queda con 30% de opacidad
//     y desaparece al cambiar de página.
//  Todo se guarda solo en el navegador de quien lee. Si localStorage falla, no pasa nada.
// ============================================================================
const CLAVE = 'cuaderno:lectura';
const IR = 'cuaderno:ir'; // se usa al venir del botón del inicio: retoma sin volver a preguntar
const MAX = 30;
const ABIERTO_MS = 3500; // cuánto tiempo se ve desplegado con el texto
const ARTICULO_MS = 5500; // en un artículo, cuánto tarda en desaparecer si no lo usas

const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch { return {}; } };
const escribir = (o) => {
  try {
    const ent = Object.entries(o).sort((a, b) => b[1].ts - a[1].ts).slice(0, MAX);
    localStorage.setItem(CLAVE, JSON.stringify(Object.fromEntries(ent)));
  } catch {}
};
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
const fraccion = () => (maxScroll() > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll())) : 0);

export function iniciarContinuar() {
  const info = document.querySelector('[data-lectura]');
  if (info) seguir(JSON.parse(info.dataset.lectura), info.dataset.texto || 'Continuar');
  const home = document.querySelector('[data-continuar-home]');
  if (home) botonInicio(home.dataset.texto || 'Continuar');
}

// ---------- el botón redondo ----------
function crearBoton(texto, descripcion, alClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'continuar-fab';
  b.setAttribute('aria-label', descripcion ? `${texto}: ${descripcion}` : texto);
  b.title = descripcion || texto;
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span></span>';
  b.querySelector('span').textContent = texto;
  b.addEventListener('click', () => alClick(b));
  document.body.append(b);
  requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('ver', 'abierto')));
  return b;
}
const quitar = (b) => { b.classList.remove('ver'); setTimeout(() => b.remove(), 400); };

// ---------- inicio ----------
function botonInicio(texto) {
  const ruta = location.pathname;
  const ultimo = Object.entries(leer())
    .filter(([r, v]) => r !== ruta && v.p > 0.03 && v.p < 0.95)
    .sort((a, b) => b[1].ts - a[1].ts)[0];
  if (!ultimo) return;
  const b = crearBoton(texto, ultimo[1].t, () => {
    try { sessionStorage.setItem(IR, ultimo[0]); } catch {}
    location.href = ultimo[0];
  });
  setTimeout(() => { b.classList.remove('abierto'); b.classList.add('tenue'); }, ABIERTO_MS);
}

// ---------- artículos, webcomics y novelas ----------
function seguir(datos, texto) {
  const ruta = location.pathname;
  let tocó = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((e) => addEventListener(e, () => (tocó = true), { once: true, passive: true }));

  const previo = leer()[ruta];
  if (previo && !location.hash && previo.p > 0.03 && previo.p < 0.95) {
    const destino = () => previo.p * maxScroll();
    let venia = false;
    try { venia = sessionStorage.getItem(IR) === ruta; sessionStorage.removeItem(IR); } catch {}

    const arrancar = () => {
      if (scrollY > 80) return; // el navegador ya restauró la posición (botón atrás)
      if (venia) { // llegó desde el botón del inicio: retoma directo
        const ir = () => { if (!tocó) scrollTo(0, destino()); };
        ir(); setTimeout(ir, 700);
        return;
      }
      const b = crearBoton(texto, '', () => { scrollTo({ top: destino(), behavior: 'smooth' }); quitar(b); });
      setTimeout(() => b.classList.remove('abierto'), ABIERTO_MS);
      setTimeout(() => quitar(b), ARTICULO_MS);
      // si ya pasó por ese punto leyendo, el botón sobra
      addEventListener('scroll', function ya() { if (scrollY >= destino() - 60) { quitar(b); removeEventListener('scroll', ya); } }, { passive: true });
    };
    if (document.readyState === 'complete') arrancar(); else addEventListener('load', arrancar, { once: true });
  }

  // --- guardar el avance ---
  let espera = null;
  const guardar = () => {
    espera = null;
    const p = fraccion();
    const o = leer();
    o[ruta] = { t: datos.titulo, p: p > 0.96 ? 1 : p, ts: Date.now() };
    escribir(o);
  };
  addEventListener('scroll', () => { if (!espera) espera = setTimeout(guardar, 500); }, { passive: true });
  addEventListener('pagehide', guardar);
  document.addEventListener('visibilitychange', () => { if (document.hidden) guardar(); });
}
