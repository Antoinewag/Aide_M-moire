/**
 * build.mjs — génère index.html (version protégée) à partir de Proteger_la_page.html
 * À garder HORS du dépôt GitHub (le dépôt ne contient que les 3 fichiers publiés).
 *
 * Installation (une fois) :  npm i terser javascript-obfuscator html-minifier-terser clean-css
 * Utilisation            :  node build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';
import CleanCSS from 'clean-css';
import { minify as minifyHTML } from 'html-minifier-terser';
import { minify as terser } from 'terser';

const SRC = 'Proteger_la_page.html', OUT = 'index.html';
let html = readFileSync(SRC, 'utf8');

// 1) JavaScript : minification (terser) puis obfuscation
const a = html.lastIndexOf('<script>') + 8, b = html.lastIndexOf('</script>');
const js = html.slice(a, b);
const min = (await terser(js, { compress: { passes: 2 }, mangle: true, format: { comments: false } })).code;
const obf = JavaScriptObfuscator.obfuscate(min, {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,            // l'app est autonome, mais on reste prudent
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,    // désactivé : coût en performance trop élevé
  deadCodeInjection: false,
  selfDefending: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
}).getObfuscatedCode();

// 2) CSS : minification
const c1 = html.indexOf('<style>') + 7, c2 = html.indexOf('</style>');
const css = new CleanCSS({ level: 2 }).minify(html.slice(c1, c2)).styles;

html = html.slice(0, c1) + css + html.slice(c2, a) + obf + html.slice(b);

// 3) HTML : suppression des commentaires et des espaces
html = await minifyHTML(html, { collapseWhitespace: true, removeComments: true, minifyCSS: false, minifyJS: false, keepClosingSlash: false });

writeFileSync(OUT, html);
console.log(`${OUT} généré : ${(html.length / 1024).toFixed(1)} Ko (source ${(readFileSync(SRC).length / 1024).toFixed(1)} Ko)`);
