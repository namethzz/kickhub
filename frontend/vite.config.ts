import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import darkTheme from './vite-plugins/dark-theme.js';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: { plugins: [darkTheme()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true, headers: { 'Referrer-Policy': 'no-referrer-when-downgrade', 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' }, proxy: { '/api': 'http://127.0.0.1:3000' } },
});
