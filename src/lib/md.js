// Markdown sencillo y seguro (escapa el HTML) para descripciones de la galería.
// Soporta: # títulos, **negrita**, *cursiva*, `código`, [enlaces](url), listas "- " y "1.", citas "> ", líneas "---", saltos de línea.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function linea(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^)\s]*)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
}

export function md(texto = '') {
  const ls = String(texto).replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < ls.length) {
    const l = ls[i];
    let m;
    if (!l.trim()) { i++; continue; }
    if ((m = /^(#{1,3})\s+(.*)$/.exec(l))) { out.push(`<h${m[1].length}>${linea(m[2])}</h${m[1].length}>`); i++; continue; }
    if (/^\s*([-*_])\1{2,}\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l)) {
      const orden = /^\s*\d+[.)]\s+/.test(l);
      const re = orden ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < ls.length && re.test(ls[i])) items.push(`<li>${linea(ls[i++].replace(re, ''))}</li>`);
      out.push(orden ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^>\s?/.test(l)) {
      const q = [];
      while (i < ls.length && /^>\s?/.test(ls[i])) q.push(linea(ls[i++].replace(/^>\s?/, '')));
      out.push(`<blockquote>${q.join('<br>')}</blockquote>`);
      continue;
    }
    const p = [];
    while (i < ls.length && ls[i].trim() && !/^(#{1,3}\s|\s*[-*]\s+|\s*\d+[.)]\s+|>\s?)/.test(ls[i])) p.push(linea(ls[i++]));
    out.push(`<p>${p.join('<br>')}</p>`);
  }
  return out.join('');
}

export const sinMd = (texto = '') =>
  String(texto).replace(/^#{1,3}\s+/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>]/g, '').replace(/\s+/g, ' ').trim();
