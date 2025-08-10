// vite.config.js frontend
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Ganti host: true menjadi host: '0.0.0.0'
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://192.168.167.158:3000', // Ganti dengan IP lokal komputer backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
