// PostCSS plugin: for every colour-bearing rule in src/**/*.css it appends a counterpart scoped to html[data-theme="dark"].
// The light CSS stays the single source of truth; nothing generated is committed. See README "Dark mode".
import { COLOR_RE, darkenValue, hasAccent } from './dark-colors.js';

const DARK = 'html[data-theme="dark"]';
const LIME_INK = '#142b22';
const KIND = [
  [/^(background|background-color|background-image)$/, 'bg'],
  [/^(color|caret-color|fill|stroke|text-decoration-color|-webkit-text-fill-color|text-emphasis-color)$/, 'text'],
  [/^(border|outline|column-rule)(-[a-z]+)*$/, 'border'],
];
const kindOf = prop => KIND.find(([pattern]) => pattern.test(prop))?.[1];
const hasColor = value => { COLOR_RE.lastIndex = 0; const found = COLOR_RE.test(value); COLOR_RE.lastIndex = 0; return found; };
const inKeyframes = rule => { for (let node = rule.parent; node; node = node.parent) if (node.type === 'atrule' && /keyframes|font-face|property/i.test(node.name)) return true; return false; };
const BARE_COLOR = /^\s*(?:#[0-9a-f]{3,8}|rgba?\([^)]*\)|white|black)\s*$/i;

function scope(selector) {
  const s = selector.trim();
  if (/^(:root|html)\b/.test(s)) return DARK + s.replace(/^(:root|html)/, '');
  return `${DARK} ${s}`;
}

export default function darkTheme({ include = /[\\/]src[\\/].*\.css$/, exclude = /[\\/](index|theme)\.css$/ } = {}) {
  return {
    postcssPlugin: 'kickhub-dark-theme',
    Once(root) {
      const file = root.source?.input?.file || '';
      if (!include.test(file) || exclude.test(file)) return;
      const rules = [];
      root.walkRules(rule => { if (!inKeyframes(rule)) rules.push(rule); });
      for (const rule of rules) {
        const entries = [];
        const backgrounds = [];
        rule.each(node => {
          if (node.type !== 'decl' || node.prop.startsWith('--')) return;
          const kind = kindOf(node.prop);
          if (!kind || /url\(/i.test(node.value)) return;
          if (kind === 'bg') backgrounds.push(node);
          if (hasColor(node.value)) entries.push({ node, kind });
        });
        // Lime accents may be written as var(--kh-lime), so look at every background declaration, not only literal colours.
        const lockText = backgrounds.some(node => hasAccent(node.value) || /var\(--kh-lime\b/.test(node.value));
        const ownText = rule.nodes.find(node => node.type === 'decl' && node.prop === 'color');
        // Dark ink on a lime accent: inherited or var()-based text colours would turn light, so pin the ink.
        const pinInk = lockText && (!ownText || /var\(/.test(ownText.value));
        if (!entries.length && !pinInk) continue;
        const context = {
          lockText,
          sameAsBackground: new Set(backgrounds.flatMap(node => (node.value.match(COLOR_RE) || []).map(raw => raw.toLowerCase()))),
        };
        const dark = rule.clone();
        dark.removeAll();
        dark.selectors = rule.selectors.map(scope);
        // Every colour declaration is emitted, even when unchanged, so the dark rules keep the same cascade order as the light ones.
        for (const { node, kind } of entries) {
          const value = darkenValue(node.value, kind, context).value;
          // A bare `background: #fff` also resets background-image; emit background-color so photos set elsewhere survive.
          const bare = node.prop === 'background' && BARE_COLOR.test(value);
          dark.append(node.clone({ prop: bare ? 'background-color' : node.prop, value }));
        }
        if (pinInk) dark.append({ prop: 'color', value: LIME_INK, important: !!ownText?.important });
        rule.after(dark);
      }
    },
  };
}
darkTheme.postcss = true;
