import { readFile, mkdir, writeFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const tokens = await readFile('src/tokens.css', 'utf8');
const css = await readFile('src/styles.css', 'utf8');
const data = (await readFile('src/data.js', 'utf8')).replaceAll('export const', 'const');
const model = (await readFile('src/model.js', 'utf8')).replace("import { media } from './data.js';", '').replaceAll('export function', 'function');
const app = (await readFile('src/app.js', 'utf8')).replace("import { media, photo } from './data.js';", '').replace("import { findMedia, formatDate } from './model.js';", '');
const preview = html.replace('<link rel="stylesheet" href="./src/tokens.css" />', `<style>${tokens}</style>`).replace('<link rel="stylesheet" href="./src/styles.css" />', `<style>${css}</style>`).replace('<script type="module" src="./src/app.js"></script>', `<script>${data}\n${model}\n${app}</script>`);
await mkdir('dist', { recursive: true });
await writeFile('dist/preview.html', preview);
console.log('Wrote dist/preview.html (fixture-only local preview)');
