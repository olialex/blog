// ============================================================================
//  continuar.js — recuerda (en localStorage) hasta dónde leíste cada página
//  · En artículos, webcomics y novelas: guarda el avance y lo retoma al volver
//  · En el inicio: muestra la tarjeta "Continuar leyendo"
//  Todo se guarda solo en el navegador de quien lee. Si localStorage falla, no pasa nada.
// ============================================================================
const CLAVE = 'cuaderno:lectura';
const MAX = 30; // páginas recordadas
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch { return {}; } };
const escribir = (o) => {
  try {
    const ent = Object.entries(o).sort((a, b) => b[1].ts - a[1].ts).slice(0, MAX);
    localStorage.setItem(CLAVE, JSON.stringify(Object.fromEntries(ent)));
  } catch {}
};
const fraccion = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
};

export function iniciarContinuar() {
  const info = document.querySelector('[data-lectura]');
  if (info) seguir(JSON.parse(info.dataset.lectura), info.dataset);
  const caja = document.querySelector('[data-continuar]');
  if (caja) mostrarTarjeta(caja);
}

function seguir(datos, textos) {
  const ruta = location.pathname;
  let tocó = false; // si la persona ya movió la página, no la movemos nosotros
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((e) => addEventListener(e, () => (tocó = true), { once: true, passive: true }));

  // --- retomar donde lo dejó ---
  const previo = leer()[ruta];
  if (previo && !location.hash && previo.p > 0.03 && previo.p < 0.95) {
    const ir = () => { if (!tocó) scrollTo(0, previo.p * (document.documentElement.scrollHeight - innerHeight)); };
    const arrancar = () => {
      if (scrollY > 80) return; // el navegador ya la restauró (botón atrás)
      ir();
      setTimeout(ir, 700); // las imágenes cargan y cambian la altura: se ajusta una vez más
      aviso(textos.retomado, textos.nuevo, () => { const o = leer(); delete o[ruta]; escribir(o); scrollTo({ top: 0 }); });
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

function aviso(texto, boton, alReiniciar) {
  const el = document.createElement('div');
  el.className = 'retomado';
  el.setAttribute('role', 'status');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = boton;
  b.onclick = () => { alReiniciar(); el.remove(); };
  el.append(document.createTextNode(texto + ' '), b);
  document.body.append(el);
  setTimeout(() => el.remove(), 7000);
}

function mostrarTarjeta(caja) {
  const o = leer();
  const ruta = location.pathname;
  const ultimo = Object.entries(o)
    .filter(([r, v]) => r !== ruta && v.p > 0.03 && v.p < 0.95)
    .sort((a, b) => b[1].ts - a[1].ts)[0];
  if (!ultimo) return;
  caja.href = ultimo[0];
  caja.querySelector('[data-titulo]').textContent = ultimo[1].t;
  caja.querySelector('[data-pct]').textContent = Math.round(ultimo[1].p * 100) + '%';
  caja.style.setProperty('--avance', Math.round(ultimo[1].p * 100) + '%');
  caja.hidden = false;
}
