import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Configuration Vite simplifiée pour SvelteKit
// La configuration Tailwind est gérée via postcss.config.js

export default defineConfig({
  server: {
    host: '0.0.0.0', // Écouter sur toutes les interfaces réseau
  },
  plugins: [
    sveltekit()
  ]
});
