import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Rorodoro Todo App',
				short_name: 'Rorodoro',
				description: 'Planifiez vos tâches et utilisez la technique Pomodoro',
				theme_color: '#dc2626',
				background_color: '#000000',
				display: 'standalone',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}']
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	]
});
