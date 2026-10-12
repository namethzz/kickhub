import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
  stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import PolicyPage from './src/features/policies/PolicyPages';export const render = kind => renderToStaticMarkup(React.createElement(MemoryRouter,{},React.createElement(PolicyPage,{kind})));`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react-dom/server', 'react-router-dom'], loader: { '.css': 'empty' },
});
const require = createRequire(import.meta.url);
const mod = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports);
const assets = await readdir(path.join(root, 'dist/assets'));
const css = assets.find(name => /^index-.*\.css$/.test(name));
if (!css) throw new Error('Missing application CSS for public policy pages');
for (const [route, kind, title] of [['privacy','privacy','นโยบายความเป็นส่วนตัว'],['terms','terms','เงื่อนไขการใช้งาน'],['data-deletion','deletion','วิธีลบข้อมูลและบัญชี']]) {
  const dir = path.join(root, 'dist', route); await mkdir(dir, { recursive: true });
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${title}ของ KickHub"><title>${title} · KickHub</title><link rel="stylesheet" href="/assets/${css}"></head><body><div class="kh-app"><header class="kh-header"><div class="kh-header-inner"><a href="/home" class="kh-brand">kickhub</a></div></header>${mod.exports.render(kind)}</div></body></html>`;
  await writeFile(path.join(dir, 'index.html'), html);
  console.log(`Public HTML generated: /${route}/`);
}
