import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, '../../../dist-electron/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname)
    }
  }
});
