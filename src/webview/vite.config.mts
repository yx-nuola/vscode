import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  base: './',
  root: __dirname,
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist-webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
});
