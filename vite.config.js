import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path will be overridden by --base flag when provided
  base: '/',
  server: {
    open: true,
    port: 3000
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    assetsInlineLimit: 0, // Don't inline any assets as base64
    sourcemap: true
  }
});
