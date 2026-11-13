// Configurazione per pubblicare il gestionale su GitHub Pages.
// Uso: npm run build:github  → genera la cartella "dist" pronta da pubblicare.
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Percorsi relativi: funziona sia su utente.github.io che su utente.github.io/nome-repo
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', target: 'es2020', sourcemap: false },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
