// Theme = "light" | "dark" | "system" (follow the device). Only an explicit light/dark choice is stored.
export const THEME_KEY = 'kh-theme';
export const THEME_EVENT = 'kh-theme-change';
export const DARK_COLOR = '#0d1511';
export const LIGHT_COLOR = '#f7f9f5';

export const resolveTheme = (stored, systemDark) => (stored === 'light' || stored === 'dark' ? stored : systemDark ? 'dark' : 'light');

export function readChoice() {
  try { const value = localStorage.getItem(THEME_KEY); return value === 'light' || value === 'dark' ? value : 'system'; }
  catch { return 'system'; }
}

const systemQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

export function applyChoice(choice) {
  const theme = resolveTheme(choice, !!systemQuery()?.matches);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? DARK_COLOR : LIGHT_COLOR);
  return theme;
}

export function saveChoice(choice) {
  try { if (choice === 'light' || choice === 'dark') localStorage.setItem(THEME_KEY, choice); else localStorage.removeItem(THEME_KEY); } catch { /* private mode: still apply for this visit */ }
  const theme = applyChoice(choice);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { choice, theme } }));
  return theme;
}

/** Keeps "system" in step with the device and other tabs. Returns an unsubscribe function. */
export function watchTheme(onChange) {
  const query = systemQuery();
  const sync = () => { const choice = readChoice(); const theme = applyChoice(choice); onChange(choice, theme); };
  const storage = event => { if (event.key === THEME_KEY || event.key === null) sync(); };
  query?.addEventListener?.('change', sync);
  window.addEventListener('storage', storage);
  window.addEventListener(THEME_EVENT, sync);
  return () => { query?.removeEventListener?.('change', sync); window.removeEventListener('storage', storage); window.removeEventListener(THEME_EVENT, sync); };
}
