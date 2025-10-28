<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	// import { onMount } from 'svelte';
	// import { registerSW } from 'virtual:pwa-register'

	let { children } = $props();

	// onMount(() => {
	// 	// Enregistre le service worker pour les mises à jour
	// 	if ('serviceWorker' in navigator) {
	// 		registerSW({ immediate: true });
	// 	}
	// });
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta name="theme-color" content="#ffffff" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.json" />
</svelte:head>

{@render children?.()}
