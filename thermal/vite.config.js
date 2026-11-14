import { defineConfig } from 'vite';

// Build a single classic (non-module) script so dist/ runs offline,
// even straight from file:// (no CORS-blocked module loading).
function classicScript() {
  return {
    name: 'classic-script',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, '<script defer')
        .replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 100000000,
    modulePreload: false,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, entryFileNames: 'assets/thermal.js' },
    },
  },
  plugins: [classicScript()],
});
