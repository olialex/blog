// ============================================================================
//  panel/archivos.mjs — imágenes (webp), íconos SVG y fuentes del proyecto
//  Lo usa panel/servidor.mjs. Sin dependencias.
// ============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';

const slug = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/\.{2,}/g, '.').replace(/^[-.]+|[-.]+$/g, '');
const existe = (p) => fs.access(p).then(() => true, () => false);

export function crearArchivos(RAIZ, importar) {
  const IMG = path.join(RAIZ, 'src', 'assets', 'img'); // Astro optimiza lo que hay aquí al compilar
  const IMG_VIEJO = path.join(RAIZ, 'public', 'img'); // carpeta anterior: se mueve sola
  const FONTS = path.join(RAIZ, 'src', 'fonts');
  const FONTS_CSS = path.join(RAIZ, 'src', 'styles', 'fuentes.css');
  const ICONOS = path.join(RAIZ, 'src', 'lib', 'iconos.js');

  // Todos los archivos de texto del proyecto donde se pueden usar imágenes, íconos y fuentes
  async function archivosTexto() {
    const salida = [];
    const andar = async (dir, exts, prof = 0) => {
      let items = [];
      try { items = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
      for (const it of items) {
        const p = path.join(dir, it.name);
        if (it.isDirectory() && prof < 5 && !['node_modules', 'fonts', 'img'].includes(it.name)) await andar(p, exts, prof + 1);
        else if (it.isFile() && exts.some((e) => it.name.endsWith(e)) && salida.length < 400) salida.push(p);
      }
    };
    await andar(path.join(RAIZ, 'src'), ['.astro', '.md', '.mdx', '.css', '.js']);
    salida.push(path.join(RAIZ, 'sitio.js'));
    const res = [];
    for (const p of salida) {
      try { res.push({ archivo: path.relative(RAIZ, p), texto: await fs.readFile(p, 'utf8') }); } catch {}
    }
    return res;
  }

  // Cuántos artículos usan cada categoría (lee el frontmatter de src/content/posts)
  async function usoCategorias() {
    const dir = path.join(RAIZ, 'src', 'content', 'posts');
    const uso = {};
    let nombres = [];
    try { nombres = await fs.readdir(dir); } catch {}
    for (const n of nombres.filter((x) => /\.mdx?$/.test(x))) {
      const t = await fs.readFile(path.join(dir, n), 'utf8').catch(() => '');
      const m = /^categoria:\s*['"]?([^'"\n]+?)['"]?\s*$/m.exec(t.split(/^---\s*$/m)[1] ?? '');
      if (m) (uso[m[1]] ??= []).push(n);
    }
    return uso;
  }

  // ---------------------------------------------------------------- IMÁGENES
  async function migrarImagenes() {
    let nombres = [];
    try { nombres = await fs.readdir(IMG_VIEJO); } catch { return; }
    await fs.mkdir(IMG, { recursive: true });
    for (const n of nombres.filter((x) => /\.(webp|jpe?g|png|avif|gif)$/i.test(x))) {
      if (!(await existe(path.join(IMG, n)))) await fs.rename(path.join(IMG_VIEJO, n), path.join(IMG, n));
    }
  }

  async function listarImagenes() {
    await migrarImagenes();
    await fs.mkdir(IMG, { recursive: true });
    const nombres = (await fs.readdir(IMG)).filter((n) => /\.webp$/i.test(n));
    const textos = await archivosTexto();
    const lista = [];
    for (const n of nombres) {
      const st = await fs.stat(path.join(IMG, n));
      lista.push({ nombre: n, bytes: st.size, url: '/img/' + n, fecha: st.mtimeMs, usos: textos.filter((t) => t.texto.includes('/img/' + n)).map((t) => t.archivo) });
    }
    return lista.sort((a, b) => b.fecha - a.fecha);
  }

  // Optimiza con sharp (mejor compresión que el navegador, y no lo afectan los Escudos de Brave)
  async function procesarImagen({ datos, ancho, calidad, objetivo }) {
    let sharp;
    try { sharp = (await import('sharp')).default; } catch { throw new Error('SIN_SHARP: falta instalar sharp (pnpm add -D sharp).'); }
    const entrada = Buffer.from(String(datos || ''), 'base64');
    if (!entrada.length || entrada.length > 40e6) throw new Error('La imagen está vacía o pesa más de 40 MB.');
    const w = Math.max(0, Math.min(8000, Number(ancho) || 0));
    const meta = await sharp(entrada, { animated: true, failOn: 'none' }).metadata();
    let base = sharp(entrada, { animated: true, failOn: 'none' }).rotate(); // respeta la orientación de la cámara
    if (w) base = base.resize({ width: w, withoutEnlargement: true });
    let q = Math.max(40, Math.min(100, Number(calidad) || 80));
    const maxBytes = (Number(objetivo) || 0) * 1024;
    let salida;
    for (;;) { // si hay peso máximo, baja la calidad de a poco (sin pasar de 50) hasta cumplirlo
      salida = await base.clone().webp({ quality: q, effort: 5, smartSubsample: true }).toBuffer({ resolveWithObject: true });
      if (!maxBytes || salida.data.length <= maxBytes || q <= 50) break;
      q -= 6;
    }
    // un WebP que no hace falta reducir y que saldría más pesado: se deja como está
    if (meta.format === 'webp' && salida.data.length >= entrada.length && !(w && meta.width > w)) {
      return { datos: entrada.toString('base64'), bytes: entrada.length, w: meta.width, h: meta.pageHeight ?? meta.height, calidad: 0 };
    }
    return { datos: salida.data.toString('base64'), bytes: salida.data.length, w: salida.info.width, h: salida.info.pageHeight ?? salida.info.height, calidad: q };
  }

  async function guardarImagen({ nombre, datos, reemplazar }) {
    const base = slug(String(nombre || '').replace(/\.webp$/i, ''));
    if (!base) throw new Error('Ponle un nombre a la imagen.');
    const buf = Buffer.from(String(datos || ''), 'base64');
    if (!buf.length || buf.length > 15e6) throw new Error('La imagen está vacía o pesa más de 15 MB.');
    if (buf.subarray(0, 4).toString() !== 'RIFF' || buf.subarray(8, 12).toString() !== 'WEBP') throw new Error('El archivo no es una imagen WebP válida.');
    const archivo = base + '.webp';
    const destino = path.join(IMG, archivo);
    await fs.mkdir(IMG, { recursive: true });
    if (!reemplazar && (await existe(destino))) throw new Error(`Ya existe "${archivo}". Cambia el nombre o marca "reemplazar".`);
    await fs.writeFile(destino, buf);
    return { nombre: archivo, url: '/img/' + archivo, bytes: buf.length };
  }

  async function borrarImagen({ nombre }) {
    await fs.rm(path.join(IMG, path.basename(String(nombre))), { force: true });
  }

  // ------------------------------------------------------------------ ÍCONOS
  const MALO = /<\s*script|<\s*style|<\s*foreignObject|\son[a-z]+\s*=|javascript:|`|\$\{|\\/i;
  const claveIcono = (k) => (/^[a-z][a-z0-9]*$/.test(k) ? k : `'${k}'`);

  async function leerIconos() {
    const { iconos } = await importar(ICONOS);
    const textos = await archivosTexto();
    const usos = {};
    for (const nombre of Object.keys(iconos)) {
      usos[nombre] = textos
        .filter((t) => !t.archivo.endsWith('iconos.js') && (t.texto.includes(`nombre="${nombre}"`) || t.texto.includes(`icono: '${nombre}'`) || t.texto.includes(`icono: "${nombre}"`)))
        .map((t) => t.archivo);
    }
    return { iconos: { ...iconos }, usos };
  }

  async function guardarIconos({ iconos }) {
    if (!iconos || typeof iconos !== 'object') throw new Error('Datos inválidos.');
    for (const [k, v] of Object.entries(iconos)) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(k)) throw new Error(`Nombre de ícono no válido: "${k}" (usa minúsculas, números y guiones).`);
      if (typeof v !== 'string' || !v.trim() || v.length > 20000) throw new Error(`El ícono "${k}" está vacío o es demasiado grande.`);
      if (MALO.test(v)) throw new Error(`El ícono "${k}" tiene contenido no permitido (scripts, estilos o caracteres especiales).`);
    }
    const codigo =
      `// ============================================================================\n//  iconos.js  —  Biblioteca de íconos SVG (estilo línea, 24x24)\n//  Se usan con el componente <Icono nombre="..." />  y en sitio.js con  icono: '...'\n//  Los administra el panel de control (pestaña Íconos).\n// ============================================================================\n\nexport const iconos = {\n` +
      Object.entries(iconos).map(([k, v]) => `  ${claveIcono(k)}: \`${v.trim()}\`,`).join('\n') + '\n};\n';
    const prueba = path.join(RAIZ, 'panel', '.iconos-prueba.mjs');
    await fs.writeFile(prueba, codigo);
    let leido;
    try { leido = (await importar(prueba)).iconos; } finally { await fs.rm(prueba, { force: true }); }
    if (JSON.stringify(leido) !== JSON.stringify(Object.fromEntries(Object.entries(iconos).map(([k, v]) => [k, v.trim()])))) throw new Error('El archivo generado no coincide. No se guardó nada.');
    await fs.writeFile(ICONOS, codigo);
  }

  // ----------------------------------------------------------------- FUENTES
  const FORMATOS = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
  const magica = (buf, ext) => {
    const m = buf.subarray(0, 4).toString('latin1');
    if (ext === 'woff2') return m === 'wOF2';
    if (ext === 'woff') return m === 'wOFF';
    if (ext === 'otf') return m === 'OTTO';
    return buf.readUInt32BE(0) === 0x00010000 || m === 'true';
  };

  async function leerBloques() {
    let css = '';
    try { css = await fs.readFile(FONTS_CSS, 'utf8'); } catch {}
    const lista = [];
    for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const b = m[1];
      const familia = /font-family:\s*['"]?([^;'"]+)['"]?\s*;/.exec(b)?.[1]?.trim();
      const archivo = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(b)?.[1];
      if (!familia || !archivo) continue;
      lista.push({
        familia,
        peso: /font-weight:\s*([^;]+);/.exec(b)?.[1]?.trim() || '400',
        estilo: /font-style:\s*([^;]+);/.exec(b)?.[1]?.trim() || 'normal',
        archivo: path.basename(archivo),
      });
    }
    return lista;
  }

  async function escribirBloques(lista) {
    const css =
      '/* Fuentes alojadas en el proyecto (archivos en src/fonts/). Las administra el panel de control (pestaña Fuentes). */\n' +
      lista.map((f) => {
        const ext = path.extname(f.archivo).slice(1).toLowerCase();
        return `@font-face { font-family: '${f.familia}'; font-weight: ${f.peso}; font-style: ${f.estilo}; font-display: block; src: url('../fonts/${f.archivo}') format('${FORMATOS[ext] || 'woff2'}'); }`;
      }).join('\n') + '\n';
    await fs.writeFile(FONTS_CSS, css);
  }

  async function listarFuentes() {
    let importado = false;
    try { importado = (await fs.readFile(path.join(RAIZ, 'src', 'layouts', 'Base.astro'), 'utf8')).includes('fuentes.css'); } catch {}
    const fuentes = await leerBloques();
    for (const f of fuentes) f.existe = await existe(path.join(FONTS, f.archivo));
    return { fuentes, importado };
  }

  async function guardarFuente({ archivo, datos, familia, peso, estilo }) {
    const ext = path.extname(String(archivo || '')).slice(1).toLowerCase();
    if (!FORMATOS[ext]) throw new Error('Formato no admitido. Usa woff2, woff, ttf u otf.');
    const fam = String(familia || '').replace(/['"\\;{}()]/g, '').trim();
    if (!fam) throw new Error('Escribe el nombre de la familia de la fuente.');
    const buf = Buffer.from(String(datos || ''), 'base64');
    if (buf.length < 100 || buf.length > 15e6) throw new Error('El archivo de fuente está vacío o pesa más de 15 MB.');
    if (!magica(buf, ext)) throw new Error('El archivo no parece una fuente ' + ext.toUpperCase() + ' válida.');
    const p = [100, 200, 300, 400, 500, 600, 700, 800, 900].includes(Number(peso)) ? String(Number(peso)) : '400';
    const e = estilo === 'italic' ? 'italic' : 'normal';
    const nombre = `${slug(fam)}-${p}${e === 'italic' ? '-italic' : ''}.${ext}`;
    await fs.mkdir(FONTS, { recursive: true });
    let lista = await leerBloques();
    const previo = lista.find((f) => f.familia === fam && f.peso === p && f.estilo === e);
    if (previo && previo.archivo !== nombre) await fs.rm(path.join(FONTS, previo.archivo), { force: true });
    lista = lista.filter((f) => f !== previo);
    lista.push({ familia: fam, peso: p, estilo: e, archivo: nombre });
    await fs.writeFile(path.join(FONTS, nombre), buf);
    await escribirBloques(lista);
    return { archivo: nombre };
  }

  async function borrarFuente({ archivo }) {
    const nombre = path.basename(String(archivo));
    const lista = (await leerBloques()).filter((f) => f.archivo !== nombre);
    await fs.rm(path.join(FONTS, nombre), { force: true });
    await escribirBloques(lista);
  }

  const dentro = (dir, nombre) => path.join(dir, path.basename(String(nombre)));
  return {
    usoCategorias, procesarImagen, listarImagenes, guardarImagen, borrarImagen, leerIconos, guardarIconos, listarFuentes, guardarFuente, borrarFuente,
    rutaImagen: (n) => dentro(IMG, n), rutaFuente: (n) => dentro(FONTS, n),
    carpetasGit: () => ['sitio.js', 'src/lib/iconos.js', 'src/fonts', 'src/styles/fuentes.css', 'src/assets/img', 'public/img', 'public/galeria'],
  };
}
