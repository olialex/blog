// ============================================================================
//  panel/servidor.mjs — Panel de control del blog (sin dependencias, solo Node)
//  Uso:  pnpm panel   →  abre http://localhost:4000
//  Lee y reescribe sitio.js, guarda un borrador por si se cierra, y hace git.
// ============================================================================
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { crearArchivos } from './archivos.mjs';

const run = promisify(execFile);

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(process.env.PANEL_RAIZ || path.join(AQUI, '..')); // carpeta del proyecto
const SITIO = path.join(RAIZ, 'sitio.js');
const ICONOS = path.join(RAIZ, 'src', 'lib', 'iconos.js');
const BORRADOR = path.join(AQUI, '.borrador.json'); // copia de seguridad de lo que estás editando
const RESPALDO = path.join(AQUI, '.respaldo-sitio.js'); // el sitio.js anterior al último guardado
const PUERTO = Number(process.env.PANEL_PUERTO) || 4000;

// ----------------------------------------------------------------------------
// Leer sitio.js
// ----------------------------------------------------------------------------
async function importar(ruta) {
  const modulo = await import(pathToFileURL(ruta).href + '?t=' + Date.now() + Math.random());
  return modulo;
}
async function cargarSitio() {
  const { sitio } = await importar(SITIO);
  return JSON.parse(JSON.stringify(sitio));
}
const arch = crearArchivos(RAIZ, importar);
async function cargarIconos() {
  try {
    const { iconos } = await importar(ICONOS);
    return Object.keys(iconos);
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------------
// Escribir sitio.js (el objeto se convierte otra vez en código JavaScript)
// ----------------------------------------------------------------------------
const ENCABEZADO = `// ============================================================================
//  sitio.js  —  AQUÍ SE EDITA TODO EL SITIO
//  Nombre, textos, menú, colores, fuentes, categorías, widgets, newsletter...
//  Los artículos se escriben aparte, en src/content/posts/*.md
//
//  Este archivo lo puede regenerar el panel de control (pnpm panel).
//  Si lo editas a mano, los comentarios dentro de cada sección se pierden
//  la próxima vez que guardes desde el panel.
// ============================================================================
`;

const TITULOS = {
  url: '1. DATOS GENERALES',
  autor: '2. AUTOR',
  navegacion: '3. MENÚ',
  hero: '4. PORTADA (página de inicio)',
  home: '4b. SECCIONES DE LA PORTADA',
  listado: '5. LISTADO DE ARTÍCULOS (/articulos/)',
  webcomics: '5b. WEBCOMICS (/webcomics/)',
  articulo: '6. ARTÍCULO INDIVIDUAL',
  widgets: '7. WIDGETS DE LA BARRA LATERAL',
  categorias: '8. CATEGORÍAS (la "clave" es lo que escribes en cada artículo)',
  newsletter: '9. NEWSLETTER',
  sobreMi: '10. PÁGINA "SOBRE MÍ"',
  pie: '11. PIE DE PÁGINA',
  textos: '12. TEXTOS DE LA INTERFAZ',
  tema: '13. APARIENCIA (colores)',
  fuentes: '14. FUENTES',
};

const IDENTIFICADOR = /^[A-Za-z_$][\w$]*$/;
const clave = (k) => (IDENTIFICADOR.test(k) ? k : cadena(k));

function cadena(s) {
  const e = s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  if (!e.includes("'")) return `'${e}'`;
  if (!e.includes('"')) return `"${e}"`;
  return `'${e.replace(/'/g, "\\'")}'`;
}

function serializar_valor(v, nivel) {
  const sp = '  '.repeat(nivel);
  const sp2 = '  '.repeat(nivel + 1);
  if (typeof v === 'string') return cadena(v);
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const lineas = v.map((x) => serializar_valor(x, 0));
    if (!lineas.some((l) => l.includes('\n'))) {
      const una = '[' + lineas.join(', ') + ']';
      if (una.length <= 90 && v.every((x) => typeof x !== 'object' || x === null)) return una;
    }
    return '[\n' + v.map((x) => sp2 + serializar_valor(x, nivel + 1) + ',').join('\n') + '\n' + sp + ']';
  }
  const ks = Object.keys(v).filter((k) => v[k] !== undefined);
  if (!ks.length) return '{}';
  if (ks.every((k) => typeof v[k] !== 'object' || v[k] === null)) {
    const una = '{ ' + ks.map((k) => `${clave(k)}: ${serializar_valor(v[k], 0)}`).join(', ') + ' }';
    if (una.length <= 100) return una;
  }
  return '{\n' + ks.map((k) => `${sp2}${clave(k)}: ${serializar_valor(v[k], nivel + 1)},`).join('\n') + '\n' + sp + '}';
}

export function serializar(sitio) {
  let salida = ENCABEZADO + '\nexport const sitio = {\n';
  for (const k of Object.keys(sitio)) {
    if (TITULOS[k]) {
      salida += `  // ${'-'.repeat(74)}\n  // ${TITULOS[k]}\n  // ${'-'.repeat(74)}\n`;
    }
    salida += `  ${clave(k)}: ${serializar_valor(sitio[k], 1)},\n\n`;
  }
  return salida.replace(/\n\n$/, '\n') + '};\n';
}

async function guardar(nuevo) {
  if (!nuevo || typeof nuevo !== 'object' || Array.isArray(nuevo)) throw new Error('Los datos no son válidos.');
  const actual = await cargarSitio();
  for (const k of Object.keys(actual)) {
    if (!(k in nuevo)) throw new Error(`Falta la sección "${k}". No se guardó nada.`);
  }
  const codigo = serializar(nuevo);

  // Prueba: el archivo generado se importa aparte y debe dar exactamente lo mismo
  const prueba = path.join(AQUI, '.sitio-prueba.mjs');
  await fs.writeFile(prueba, codigo);
  let leido;
  try {
    leido = (await importar(prueba)).sitio;
  } finally {
    await fs.rm(prueba, { force: true });
  }
  if (JSON.stringify(leido) !== JSON.stringify(nuevo)) {
    throw new Error('El archivo generado no coincide con lo que editaste. No se guardó nada.');
  }

  await fs.copyFile(SITIO, RESPALDO).catch(() => {});
  await fs.writeFile(SITIO + '.tmp', codigo);
  await fs.rename(SITIO + '.tmp', SITIO);
  await fs.rm(BORRADOR, { force: true });
}

// ----------------------------------------------------------------------------
// Borrador (se guarda mientras editas, por si se cierra el navegador o la terminal)
// ----------------------------------------------------------------------------
async function leerBorrador() {
  try {
    return JSON.parse(await fs.readFile(BORRADOR, 'utf8'));
  } catch {
    return null;
  }
}
async function guardarBorrador(sitio) {
  await fs.writeFile(BORRADOR + '.tmp', JSON.stringify({ guardado: new Date().toISOString(), sitio }));
  await fs.rename(BORRADOR + '.tmp', BORRADOR);
}

// ----------------------------------------------------------------------------
// Git
// ----------------------------------------------------------------------------
const git = (...args) =>
  run('git', args, { cwd: RAIZ, timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });

async function estadoGit() {
  try {
    await git('rev-parse', '--is-inside-work-tree');
  } catch {
    return { repo: false };
  }
  const rama = (await git('rev-parse', '--abbrev-ref', 'HEAD').catch(() => ({ stdout: '' }))).stdout.trim();
  const remoto = (await git('remote').catch(() => ({ stdout: '' }))).stdout.trim().split('\n')[0] || '';
  const rutas = await rutasGit();
  const cambios = rutas.length ? (await git('status', '--porcelain', '--', ...rutas).catch(() => ({ stdout: '' }))).stdout.trim() : '';
  return { repo: true, rama, remoto, sinSubir: Boolean(cambios) };
}

// Archivos que el panel puede cambiar (solo los que existen o ya están en git)
async function rutasGit() {
  const sal = [];
  for (const r of arch.carpetasGit()) {
    const hay = await fs.access(path.join(RAIZ, r)).then(() => true, () => false);
    const rastreado = hay || (await git('ls-files', '--', r).catch(() => ({ stdout: '' }))).stdout.trim();
    if (rastreado) sal.push(r);
  }
  return sal;
}

async function publicar(mensaje) {
  const texto = String(mensaje || '').trim().slice(0, 200) || 'Actualizar el sitio desde el panel';
  const pasos = [];
  try {
    await git('rev-parse', '--is-inside-work-tree');
  } catch {
    throw new Error('Esta carpeta no es un repositorio git.');
  }

  const rutas = await rutasGit();
  await git('add', '-A', '--', ...rutas);
  let hayCambios = true;
  try {
    await git('diff', '--cached', '--quiet', '--', ...rutas);
    hayCambios = false;
  } catch {}

  if (hayCambios) {
    try {
      await git('commit', '-m', texto, '--', ...rutas);
      pasos.push('Commit creado: ' + texto);
    } catch (e) {
      throw new Error('No se pudo hacer el commit: ' + (e.stderr || e.message));
    }
  } else {
    pasos.push('No había cambios nuevos, no se creó un commit.');
  }

  try {
    await git('push');
  } catch (e) {
    const err = String(e.stderr || e.message);
    if (/no upstream|has no upstream/i.test(err)) {
      try {
        await git('push', '-u', 'origin', 'HEAD');
      } catch (e2) {
        throw new Error('El commit se hizo, pero el push falló: ' + (e2.stderr || e2.message));
      }
    } else {
      throw new Error('El commit se hizo, pero el push falló: ' + err);
    }
  }
  pasos.push('Push hecho: GitHub empezará a desplegar.');
  return pasos;
}

// ----------------------------------------------------------------------------
// Servidor (solo acepta conexiones de tu propio computador)
// ----------------------------------------------------------------------------
const enviar = (res, codigo, datos) => {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(datos));
};

function leerCuerpo(req, limite = 2_000_000) {
  return new Promise((resolver, rechazar) => {
    let total = 0;
    const partes = [];
    req.on('data', (p) => {
      total += p.length;
      if (total > limite) {
        rechazar(new Error('Datos demasiado grandes.'));
        req.destroy();
      } else partes.push(p);
    });
    req.on('end', () => {
      try {
        resolver(partes.length ? JSON.parse(Buffer.concat(partes).toString('utf8')) : {});
      } catch {
        rechazar(new Error('JSON inválido.'));
      }
    });
    req.on('error', rechazar);
  });
}

const hostsPermitidos = () => new Set([`localhost:${PUERTO}`, `127.0.0.1:${PUERTO}`]);

export const servidor = http.createServer(async (req, res) => {
  try {
    if (!hostsPermitidos().has(req.headers.host || '')) return enviar(res, 403, { error: 'Host no permitido.' });
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/') {
      const html = await fs.readFile(path.join(AQUI, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }

    if (req.method === 'GET' && url.pathname === '/assets.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(await fs.readFile(path.join(AQUI, 'assets.js')));
    }
    if (req.method === 'GET' && url.pathname.startsWith('/img/')) {
      const buf = await fs.readFile(arch.rutaImagen(decodeURIComponent(url.pathname.slice(5))));
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' });
      return res.end(buf);
    }

    if (!url.pathname.startsWith('/api/')) return enviar(res, 404, { error: 'No existe.' });
    // Las peticiones que cambian algo deben traer esta cabecera (protege contra otras páginas web)
    if (req.method !== 'GET' && req.headers['x-panel'] !== '1') return enviar(res, 403, { error: 'Petición no permitida.' });

    if (req.method === 'GET' && url.pathname === '/api/datos') {
      return enviar(res, 200, {
        sitio: await cargarSitio(),
        iconos: await cargarIconos(),
        borrador: await leerBorrador(),
        git: await estadoGit(),
      });
    }
    if (req.method === 'PUT' && url.pathname === '/api/borrador') {
      const { sitio } = await leerCuerpo(req);
      await guardarBorrador(sitio);
      return enviar(res, 200, { ok: true });
    }
    if (req.method === 'DELETE' && url.pathname === '/api/borrador') {
      await fs.rm(BORRADOR, { force: true });
      return enviar(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/guardar') {
      const { sitio } = await leerCuerpo(req);
      await guardar(sitio);
      return enviar(res, 200, { ok: true, git: await estadoGit() });
    }
    if (req.method === 'POST' && url.pathname === '/api/publicar') {
      const { mensaje } = await leerCuerpo(req);
      return enviar(res, 200, { ok: true, pasos: await publicar(mensaje) });
    }
    if (req.method === 'GET' && url.pathname === '/api/categorias-uso') return enviar(res, 200, { uso: await arch.usoCategorias() });
    // ----- imágenes, íconos y fuentes -----
    const B = (l) => leerCuerpo(req, l);
    const G = 25_000_000;
    if (req.method === 'GET' && url.pathname === '/api/imagenes') return enviar(res, 200, { imagenes: await arch.listarImagenes() });
    if (req.method === 'POST' && url.pathname === '/api/imagenes') return enviar(res, 200, await arch.guardarImagen(await B(G)));
    if (req.method === 'POST' && url.pathname === '/api/imagenes/borrar') { await arch.borrarImagen(await B()); return enviar(res, 200, { ok: true }); }
    if (req.method === 'GET' && url.pathname === '/api/iconos') return enviar(res, 200, await arch.leerIconos());
    if (req.method === 'POST' && url.pathname === '/api/iconos') { await arch.guardarIconos(await B(5_000_000)); return enviar(res, 200, { ok: true, git: await estadoGit() }); }
    if (req.method === 'GET' && url.pathname === '/api/fuentes') return enviar(res, 200, await arch.listarFuentes());
    if (req.method === 'POST' && url.pathname === '/api/fuentes') return enviar(res, 200, await arch.guardarFuente(await B(G)));
    if (req.method === 'POST' && url.pathname === '/api/fuentes/borrar') { await arch.borrarFuente(await B()); return enviar(res, 200, { ok: true }); }
    return enviar(res, 404, { error: 'No existe.' });
  } catch (e) {
    return enviar(res, 400, { error: e.message || String(e) });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  servidor.listen(PUERTO, '127.0.0.1', () => {
    console.log(`\n  Panel del blog listo → http://localhost:${PUERTO}\n  (Ctrl + C para cerrarlo)\n`);
  });
  servidor.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `\n  El puerto ${PUERTO} ya está en uso. ¿Ya tienes el panel abierto?\n` : e);
    process.exit(1);
  });
}
