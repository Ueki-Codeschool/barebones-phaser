import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use the base path from the command line (--base flag) or environment variable
  // Default to relative paths for local development
  const base = process.env.BASE_PATH || './';
  
  return {
    base,
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
  };
});
