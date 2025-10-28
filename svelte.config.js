import adapter from '@sveltejs/adapter-netlify';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Active le préprocesseur Svelte
  preprocess: preprocess(),

  kit: {
    // Configuration de l'adaptateur Netlify
    adapter: adapter({
      // Configuration Netlify
      edge: false,
      split: false
    }),
    // Configuration des alias
    alias: {
      $lib: './src/lib',
      '$lib/*': './src/lib/*'
    }
  }
};

export default config;
