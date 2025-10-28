import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Configuration pour le déploiement Edge Functions
			edge: false,
			// Ne pas diviser le code côté serveur
			split: false
		}),
		// Assurez-vous que les fichiers statiques sont correctement servis
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		},
		// Désactive le préchargement des données par défaut pour améliorer les performances
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'style-src': ['self', 'unsafe-inline', 'https:'],
				'img-src': ['self', 'data:', 'https:'],
				'connect-src': ['self', 'https:'],
				'font-src': ['self', 'https:'],
				'object-src': ['none'],
				'base-uri': ['self']
			}
		}
	}
};

export default config;
