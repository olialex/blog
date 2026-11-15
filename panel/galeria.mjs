// ============================================================================
//  panel/galeria.mjs — álbumes y fotos de la galería (public/galeria)
//  Lo usa panel/servidor.mjs. Necesita sharp (el mismo que ya usa el panel).
//
//  Cada álbum es una carpeta con un album.json y, por cada foto, dos archivos:
//    <id>-m.webp  miniatura (liviana, para la cuadrícula)
//    <id>-g.webp  la foto para el visor (grande, pero optimizada)
//  Los subálbumes son subcarpetas. Para curar: borra la foto o la carpeta desde el panel.
// ============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';

const limpiar = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const existe = (p) => fs.access(p).then(() => true, () => false);
const fechaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = () => fechaLocal(new Date());
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const texto = (v, max) => String(v ?? '').slice(0, max);
const lista = (v) => (Array.isArray(v) ? v : String(v ?? '').split(','))
  .map((x) => texto(x, 40).trim()).filter(Boolean).slice(0, 30);

export function crearGaleria(RAIZ, config) {
  const GAL = path.join(RAIZ, 'public', 'galeria');

  // 'paisajes/2026' → { partes, dir } (solo letras minúsculas, números y guiones: así nadie se sale de la carpeta)
  function ubicar(ruta) {
    const partes = String(ruta || '').split('/').filter(Boolean);
    if (partes.length > 4 || partes.some((p) => !/^[a-z0-9][a-z0-9-]*$/.test(p))) throw new Error('Ruta de álbum no válida.');
    return { partes, dir: path.join(GAL, ...partes) };
  }

  const vacio = (titulo = '') => ({ titulo, descripcion: '', fecha: hoy(), etiquetas: [], portada: '', noListado: false, fotos: [] });

  async function leerJson(dir) {
    try { return JSON.parse(await fs.readFile(path.join(dir, 'album.json'), 'utf8')); } catch { return null; }
  }
  const escribirJson = (dir, datos) => fs.writeFile(path.join(dir, 'album.json'), JSON.stringify(datos, null, 2) + '\n');

  // ------------------------------------------------------------------ ÁRBOL
  async function arbol(ruta = '') {
    const { partes, dir } = ubicar(ruta);
    let items = [];
    try { items = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
    const salida = [];
    for (const it of items.filter((x) => x.isDirectory() && /^[a-z0-9][a-z0-9-]*$/.test(x.name))) {
      const sub = path.join(dir, it.name);
      const a = (await leerJson(sub)) ?? vacio(it.name);
      salida.push({
        ruta: [...partes, it.name].join('/'), titulo: a.titulo || it.name, fotos: (a.fotos ?? []).length,
        noListado: Boolean(a.noListado), portada: a.portada || a.fotos?.[0]?.id || '', hijos: await arbol([...partes, it.name].join('/')),
      });
    }
    return salida.sort((x, y) => x.titulo.localeCompare(y.titulo, 'es'));
  }

  async function leerAlbum(ruta) {
    const { dir } = ubicar(ruta);
    const a = await leerJson(dir);
    if (!a) throw new Error('Ese álbum no existe.');
    return { ruta, ...vacio(), ...a };
  }

  // ------------------------------------------------------------------ ÁLBUMES
  async function crearAlbum({ padre = '', titulo }) {
    const nombre = texto(titulo, 120).trim();
    if (!nombre) throw new Error('Ponle un título al álbum.');
    if (padre) await leerAlbum(padre); // el padre debe existir
    const { partes, dir: dirPadre } = ubicar(padre);
    const base = limpiar(nombre) || 'album';
    let carpeta = base;
    for (let n = 2; await existe(path.join(dirPadre, carpeta)); n++) carpeta = `${base}-${n}`;
    const dir = path.join(dirPadre, carpeta);
    await fs.mkdir(dir, { recursive: true });
    await escribirJson(dir, vacio(nombre));
    return { ruta: [...partes, carpeta].join('/') };
  }

  async function guardarAlbum({ ruta, album }) {
    const { dir } = ubicar(ruta);
    const previo = await leerAlbum(ruta);
    const a = album ?? {};
    const titulo = texto(a.titulo, 120).trim();
    if (!titulo) throw new Error('El álbum necesita un título.');
    // Las fotos: se respeta el orden y los textos que llegan, pero nunca se pierde ni se inventa una foto
    const porId = new Map(previo.fotos.map((f) => [f.id, f]));
    const recibidas = Array.isArray(a.fotos) ? a.fotos : [];
    const orden = [];
    for (const r of recibidas) {
      const f = porId.get(r?.id);
      if (!f || orden.some((x) => x.id === f.id)) continue;
      orden.push({
        ...f,
        titulo: texto(r.titulo, 160).trim(),
        fecha: esFecha(r.fecha) ? r.fecha : f.fecha,
        descripcion: texto(r.descripcion, 20000),
        etiquetas: lista(r.etiquetas),
      });
    }
    for (const f of previo.fotos) if (!orden.some((x) => x.id === f.id)) orden.push(f);
    const salida = {
      titulo,
      descripcion: texto(a.descripcion, 20000),
      fecha: esFecha(a.fecha) ? a.fecha : previo.fecha,
      etiquetas: lista(a.etiquetas),
      portada: orden.some((f) => f.id === a.portada) ? a.portada : '',
      noListado: Boolean(a.noListado),
      fotos: orden,
    };
    await escribirJson(dir, salida);
    return { ok: true };
  }

  async function borrarAlbum({ ruta }) {
    const { partes, dir } = ubicar(ruta);
    if (!partes.length) throw new Error('Indica qué álbum borrar.');
    await fs.rm(dir, { recursive: true, force: true });
    return { ok: true };
  }

  // ------------------------------------------------------------------ FOTOS
  async function subirFoto({ album, nombre, datos, modificado }) {
    let sharp;
    try { sharp = (await import('sharp')).default; } catch { throw new Error('Falta instalar sharp (pnpm add sharp).'); }
    const { dir } = ubicar(album);
    const a = await leerAlbum(album);
    const entrada = Buffer.from(String(datos || ''), 'base64');
    if (!entrada.length || entrada.length > 60e6) throw new Error('La imagen está vacía o pesa más de 60 MB.');

    const cfg = { miniaturaAlto: 440, visorLado: 1800, calidadMiniatura: 72, calidadVisor: 82, ...((await config?.()) ?? {}) };
    const num = (v, min, max, def) => Math.max(min, Math.min(max, Number(v) || def));
    const alto = num(cfg.miniaturaAlto, 120, 1200, 440);
    const lado = num(cfg.visorLado, 800, 4000, 1800);

    let meta;
    try { meta = await sharp(entrada, { failOn: 'none' }).metadata(); } catch { throw new Error('No pude leer esa imagen.'); }
    const base = () => sharp(entrada, { failOn: 'none' }).rotate(); // respeta la orientación; sharp quita los datos EXIF (GPS, etc.)
    const visor = await base()
      .resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: num(cfg.calidadVisor, 40, 100, 82), effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    const mini = await base()
      .resize({ width: alto * 3, height: alto, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: num(cfg.calidadMiniatura, 40, 100, 72), effort: 5, smartSubsample: true })
      .toBuffer();
    const px = await sharp(mini).resize(1, 1).removeAlpha().raw().toBuffer(); // color promedio: sirve de fondo mientras carga
    const color = '#' + [...px].slice(0, 3).map((n) => n.toString(16).padStart(2, '0')).join('');

    // Fecha: la de la cámara (EXIF) si existe; si no, la de modificación del archivo; si no, hoy
    let fecha = '';
    const m = meta.exif ? /(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/.exec(meta.exif.toString('latin1')) : null;
    if (m && Number(m[1]) > 1990) fecha = `${m[1]}-${m[2]}-${m[3]}`;
    if (!fecha && Number(modificado) > 0) fecha = fechaLocal(new Date(Number(modificado)));
    if (!fecha) fecha = hoy();

    const titulo = texto(nombre, 200).replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
    const raiz = limpiar(titulo) || 'foto';
    let id = raiz;
    for (let n = 2; a.fotos.some((f) => f.id === id) || (await existe(path.join(dir, `${id}-g.webp`))); n++) id = `${raiz}-${n}`;

    await fs.writeFile(path.join(dir, `${id}-g.webp`), visor.data);
    await fs.writeFile(path.join(dir, `${id}-m.webp`), mini);
    const foto = { id, titulo, fecha, descripcion: '', etiquetas: [], w: visor.info.width, h: visor.info.height, c: color };
    a.fotos.unshift(foto);
    const { ruta, ...resto } = a;
    await escribirJson(dir, resto);
    return { foto, bytes: visor.data.length + mini.length };
  }

  async function borrarFoto({ album, id }) {
    const { dir } = ubicar(album);
    const a = await leerAlbum(album);
    if (!a.fotos.some((f) => f.id === id)) throw new Error('Esa foto no existe.');
    await fs.rm(path.join(dir, `${id}-g.webp`), { force: true });
    await fs.rm(path.join(dir, `${id}-m.webp`), { force: true });
    a.fotos = a.fotos.filter((f) => f.id !== id);
    if (a.portada === id) a.portada = '';
    const { ruta, ...resto } = a;
    await escribirJson(dir, resto);
    return { ok: true };
  }

  async function moverFoto({ album, id, a: destino }) {
    if (album === destino) throw new Error('Ya está en ese álbum.');
    const origen = await leerAlbum(album);
    const dest = await leerAlbum(destino);
    const foto = origen.fotos.find((f) => f.id === id);
    if (!foto) throw new Error('Esa foto no existe.');
    const dO = ubicar(album).dir, dD = ubicar(destino).dir;
    let nuevo = id;
    for (let n = 2; dest.fotos.some((f) => f.id === nuevo) || (await existe(path.join(dD, `${nuevo}-g.webp`))); n++) nuevo = `${id}-${n}`;
    for (const suf of ['g', 'm']) await fs.rename(path.join(dO, `${id}-${suf}.webp`), path.join(dD, `${nuevo}-${suf}.webp`));
    origen.fotos = origen.fotos.filter((f) => f.id !== id);
    if (origen.portada === id) origen.portada = '';
    dest.fotos.unshift({ ...foto, id: nuevo });
    const { ruta: r1, ...o } = origen; const { ruta: r2, ...d } = dest;
    await escribirJson(dO, o); await escribirJson(dD, d);
    return { ok: true, id: nuevo };
  }

  // Ruta absoluta de un archivo de la galería (para mostrar vistas previas en el panel)
  function archivo(rel) {
    const partes = String(rel || '').split('/').filter(Boolean);
    if (!partes.length || partes.some((p) => !/^[a-z0-9][a-z0-9._-]*$/.test(p) || p.includes('..'))) throw new Error('Ruta no válida.');
    return path.join(GAL, ...partes);
  }

  return { arbol, leerAlbum, crearAlbum, guardarAlbum, borrarAlbum, subirFoto, borrarFoto, moverFoto, archivo };
}
