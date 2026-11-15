/**
 * Abre en una pestaña nueva todos los enlaces HTTP(S) que apunten
 * fuera del origen actual del blog. Funciona también con enlaces
 * añadidos dinámicamente por componentes o scripts.
 */
const SELECTOR_ENLACES = 'a[href]';

function prepararEnlace(enlace) {
  const href = enlace.getAttribute('href');
  if (!href) return;

  let destino;
  try {
    destino = new URL(href, window.location.href);
  } catch {
    return;
  }

  // Solo tratamos enlaces web. Se excluyen mailto:, tel:, javascript:, #, etc.
  if (destino.protocol !== 'http:' && destino.protocol !== 'https:') return;

  // Los enlaces del propio blog conservan su comportamiento habitual.
  if (destino.origin === window.location.origin) return;

  enlace.setAttribute('target', '_blank');

  // Conserva otros valores rel y añade protecciones para target="_blank".
  const rel = new Set((enlace.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
  rel.add('noopener');
  rel.add('noreferrer');
  enlace.setAttribute('rel', [...rel].join(' '));
}

function revisarNodo(nodo) {
  if (!(nodo instanceof Element)) return;

  if (nodo.matches(SELECTOR_ENLACES)) prepararEnlace(nodo);
  nodo.querySelectorAll(SELECTOR_ENLACES).forEach(prepararEnlace);
}

// Procesa todos los enlaces presentes al cargar el módulo.
document.querySelectorAll(SELECTOR_ENLACES).forEach(prepararEnlace);

// También procesa enlaces que Astro, un componente o un script añada después.
const observador = new MutationObserver((cambios) => {
  for (const cambio of cambios) {
    if (cambio.type === 'childList') {
      cambio.addedNodes.forEach(revisarNodo);
    } else if (cambio.type === 'attributes' && cambio.target instanceof Element) {
      prepararEnlace(cambio.target);
    }
  }
});

observador.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['href'],
});
