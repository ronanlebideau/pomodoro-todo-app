import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Configuration de base de Vite
export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: '0.0.0.0' // Écouter sur toutes les interfaces réseau
  },
  // Désactiver le PWA pour Netlify via la configuration
  // Le plugin PWA sera chargé uniquement si ENABLE_PWA n'est pas 'false'
  // Cette configuration est gérée dans netlify.toml
});
