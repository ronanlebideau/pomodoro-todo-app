import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// Temporairement désactivé pour diagnostic
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	server: {
		host: '0.0.0.0', // Écouter sur toutes les interfaces réseau pour contourner les problèmes IPv6 de macOS 26.0.1
	},
	plugins: [
		tailwindcss(),
		sveltekit()
		// Temporairement désactivé pour diagnostic
		// SvelteKitPWA({
		// 	registerType: 'autoUpdate',
		// 	manifest: {
		// 		name: 'Rorodoro Todo',
		// 		short_name: 'Rorodoro',
		// 		description: 'Planifiez vos tâches et utilisez la technique Rorodoro',
		// 		theme_color: '#dc2626',
		// 		background_color: '#000000',
		// 		display: 'standalone',
		// 		icons: [
		// 			{
		// 				src: '/icon-192.png',
		// 				sizes: '192x192',
		// 				type: 'image/png'
		// 			},
		// 			{
		// 				src: '/icon-512.png',
		// 				sizes: '512x512',
		// 				type: 'image/png'
		// 			}
		// 		]
		// 	},
		// 	workbox: {
		// 		globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}']
		// 	},
		// 	devOptions: {
		// 		enabled: true,
		// 		type: 'module'
		// 	}
		// })
	]
});
