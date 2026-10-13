// Colour mapping used by the dark-theme PostCSS plugin. Pure functions, no dependencies, covered by test/dark-colors.test.mjs.
//
// Idea: the light stylesheet stays the single source of truth. For every colour we decide, by the property it is used on,
// what it should become on a dark page:
//   bg     light surfaces become dark ones (keeping their order); dark panels and lime accents stay as they are
//   text   dark ink becomes light ink; white and lime text stays (it sits on dark panels or accents)
//   border light hairlines become dark hairlines; white rings become the card colour

export const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b|rgba?\(\s*[^)]*\)|\b(?:white|black)\b/gi;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const hex2 = value => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');

export function parseColor(text) {
  const raw = text.trim().toLowerCase();
  if (raw === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (raw === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (raw[0] === '#') {
    let h = raw.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const match = raw.match(/^rgba?\(\s*([^)]*)\)$/);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const channel = part => (part.endsWith('%') ? (parseFloat(part) / 100) * 255 : parseFloat(part));
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  const [r, g, b] = parts.slice(0, 3).map(channel);
  return [r, g, b, alpha].some(Number.isNaN) ? null : { r, g, b, a: clamp(alpha) };
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function formatColor({ r, g, b }, a = 1) {
  return a >= 0.999 ? `#${hex2(r)}${hex2(g)}${hex2(b)}` : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(3)})`;
}

// The brand's lime family (hue ~65-100, saturated, light). It keeps its colour in dark mode.
export const isAccent = ({ h, s, l }) => h >= 65 && h <= 100 && s >= 0.5 && l >= 0.5;

// Brand tint for greys: pure neutrals become the same green-black the page already uses.
const tint = ({ h, s }, fallbackSaturation) => (s < 0.06 ? { h: 150, s: fallbackSaturation } : { h, s });

/** Maps one parsed colour for a given usage ("bg" | "text" | "border"). Returns { color, alpha, kept }. */
export function darkColor(color, kind) {
  const hsl = rgbToHsl(color);
  const alpha = color.a;
  const keep = () => ({ color, alpha, kept: true });
  const out = (h, s, l, a = alpha) => ({ color: hslToRgb({ h, s: clamp(s), l: clamp(l) }), alpha: a, kept: false });
  if (isAccent(hsl)) return keep();
  const translucent = alpha < 0.85;
  if (kind === 'bg') {
    if (translucent) {
      // A faint black tint (hover wash) must become a faint white tint; scrims and glass over photos stay.
      return hsl.l <= 0.3 && alpha <= 0.2 ? { color: { r: 255, g: 255, b: 255 }, alpha, kept: false } : keep();
    }
    if (hsl.l < 0.5) return keep();
    if (hsl.l >= 0.995) return out(150, 0.12, 0.115); // cards and white panels
    const t = tint(hsl, 0.12);
    return out(t.h, Math.min(t.s, 0.3) * 0.8, 0.04 + ((hsl.l - 0.5) / 0.5) * 0.05);
  }
  if (kind === 'text') {
    if (hsl.l >= 0.5 && !translucent) return keep();
    if (translucent && hsl.l >= 0.5) return keep();
    const t = tint(hsl, 0.1);
    return out(t.h, t.s * 0.55, 0.93 - 0.55 * hsl.l);
  }
  // border
  if (translucent) return hsl.l >= 0.5 ? keep() : (hsl.l <= 0.3 && alpha <= 0.2 ? { color: { r: 255, g: 255, b: 255 }, alpha, kept: false } : keep());
  if (hsl.l >= 0.995) return out(150, 0.12, 0.115); // white rings match the card they sit on
  if (hsl.l >= 0.5) { const t = tint(hsl, 0.1); return out(t.h, Math.min(t.s, 0.3) * 0.7, 0.32 - (hsl.l - 0.5) * 0.3); }
  const t = tint(hsl, 0.1);
  return out(t.h, t.s * 0.55, 0.93 - 0.55 * hsl.l);
}

/**
 * Rewrites every colour inside a declaration value. `context.lockText` keeps dark ink as is (used on lime accents);
 * `context.sameAsBackground` is a Set of raw colours that a border must not change away from (ring == fill).
 */
export function darkenValue(value, kind, context = {}) {
  let changed = false;
  const next = value.replace(COLOR_RE, raw => {
    const parsed = parseColor(raw);
    if (!parsed) return raw;
    if (kind === 'text' && context.lockText && rgbToHsl(parsed).l < 0.5) return raw;
    if (kind === 'border' && context.sameAsBackground?.has(raw.toLowerCase())) return raw;
    const result = darkColor(parsed, kind);
    if (result.kept) return raw;
    changed = true;
    return formatColor(result.color, result.alpha);
  });
  return { value: next, changed };
}

export const hasAccent = value => (value.match(COLOR_RE) || []).some(raw => { const p = parseColor(raw); return p && p.a >= 0.85 && isAccent(rgbToHsl(p)); });
