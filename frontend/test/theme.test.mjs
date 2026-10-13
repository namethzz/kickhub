import { test } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { resolveTheme } from '../src/lib/theme.js';
import { darkenValue, parseColor, rgbToHsl, hasAccent } from '../vite-plugins/dark-colors.js';
import darkTheme from '../vite-plugins/dark-theme.js';

const luminance = hex => { const { r, g, b } = parseColor(hex); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const generate = async (css, from = '/app/src/features/x/x.css') => (await postcss([darkTheme()]).process(css, { from })).css;

test('an explicit choice wins; otherwise the device decides', () => {
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(undefined, false), 'light');
  assert.equal(resolveTheme('banana', true), 'dark');
  assert.equal(resolveTheme('banana', false), 'light');
});

test('light surfaces become dark and dark text becomes light', () => {
  const bg = darkenValue('#ffffff', 'bg').value;
  const text = darkenValue('#172e24', 'text').value;
  assert.ok(luminance(bg) < 0.08, `background ${bg}`);
  assert.ok(luminance(text) > 0.5, `text ${text}`);
  assert.ok(contrast(bg, text) >= 7, `contrast ${contrast(bg, text)}`);
});

test('lime accents are recognised so their dark ink is kept', () => {
  assert.ok(hasAccent('#cdf46c'));
  assert.ok(!hasAccent('#ffffff'));
  assert.ok(!hasAccent('#173c2b'));
  const { h } = rgbToHsl(parseColor('#cdf46c'));
  assert.ok(h > 65 && h < 100);
});

test('the plugin appends a dark counterpart after each coloured rule and leaves the light rule alone', async () => {
  const css = '.card{background:#fff;color:#172e24;border:1px solid #e0e6db;padding:8px}';
  const out = await generate(css);
  assert.ok(out.startsWith(css), 'light rule is unchanged and first');
  const dark = out.slice(css.length);
  assert.match(dark, /html\[data-theme="dark"\] \.card\s*\{/);
  assert.match(dark, /background/);
  assert.match(dark, /border/);
  assert.doesNotMatch(dark, /padding/);
});

test('a lime button keeps dark ink in dark mode', async () => {
  const out = await generate('.cta{background:#cdf46c;color:#214932}');
  const dark = out.slice(out.indexOf('html[data-theme="dark"]'));
  assert.match(dark, /color:\s*#(142b22|214932)/i);
  assert.match(dark, /#cdf46c/i);
});

test('keyframes, custom properties, images and files outside src are ignored', async () => {
  const frames = await generate('@keyframes spin{from{color:#fff}to{color:#000}}');
  assert.doesNotMatch(frames, /data-theme/);
  const vars = await generate(':root{--x:#fff}');
  assert.doesNotMatch(vars, /data-theme/);
  const photo = await generate('.hero{background:url(/hero.png) center/cover}');
  assert.doesNotMatch(photo, /data-theme/);
  const outside = await generate('.card{background:#fff}', '/app/node_modules/lib/lib.css');
  assert.doesNotMatch(outside, /data-theme/);
});

test('a bare background shorthand does not wipe a photo set elsewhere', async () => {
  const out = await generate('.panel{background:#fff}');
  assert.match(out.slice(out.indexOf('html[data-theme="dark"]')), /background-color/);
});
