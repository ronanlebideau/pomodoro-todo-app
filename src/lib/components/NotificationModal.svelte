<script lang="ts">
	import { pomodoroStore } from '$lib/stores/pomodoroStore';
	import { Play, Coffee, RotateCcw, Volume2, Square } from 'lucide-svelte';

	function handleStartFocus() {
		pomodoroStore.stopNotification();
		$pomodoroStore.showNotificationModal = false;
		pomodoroStore.startFocus();
	}

	function handleStartBreak() {
		pomodoroStore.stopNotification();
		$pomodoroStore.showNotificationModal = false;
		pomodoroStore.startBreak(false);
	}

	function handleStartLongBreak() {
		pomodoroStore.stopNotification();
		$pomodoroStore.showNotificationModal = false;
		pomodoroStore.startBreak(true);
	}

	function handleStopNotification() {
		pomodoroStore.stopNotification();
	}

	function handleStopSession() {
		pomodoroStore.stopNotification();
		$pomodoroStore.showNotificationModal = false;
		pomodoroStore.stop();
	}
</script>

{#if $pomodoroStore.showNotificationModal}
	<div class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
		<div class="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl animate-in slide-in-from-top-4 duration-300">
			<!-- Header -->
			<div class="p-6 border-b border-zinc-800">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
						<Volume2 class="w-6 h-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Session terminée !</h2>
						<p class="text-sm text-zinc-400">
							{$pomodoroStore.state === 'focus' ? 'Temps de faire une pause' : 'Prêt à reprendre le travail ?'}
						</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-4">
				<div class="text-center">
					<p class="text-zinc-300 mb-4">
						Que souhaitez-vous faire maintenant ?
					</p>

					<!-- Action buttons -->
					<div class="space-y-3">
						{#if $pomodoroStore.state === 'focus'}
							<button
								on:click={handleStartBreak}
								class="w-full flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
							>
								<Coffee class="w-5 h-5" />
								Commencer une pause courte (5 min)
							</button>

							{#if $pomodoroStore.completedSessions > 0 && $pomodoroStore.completedSessions % $pomodoroStore.config.sessionsBeforeLongBreak === 0}
								<button
									on:click={handleStartLongBreak}
									class="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
								>
									<Coffee class="w-5 h-5" />
									Commencer une pause longue (15 min)
								</button>
							{/if}

							<button
								on:click={handleStartFocus}
								class="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
							>
								<Play class="w-5 h-5" />
								Continuer avec le focus
							</button>
						{:else}
							<button
								on:click={handleStartFocus}
								class="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
							>
								<Play class="w-5 h-5" />
								Reprendre le travail
							</button>

							<button
								on:click={handleStartBreak}
								class="w-full flex items-center gap-3 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
							>
								<Coffee class="w-5 h-5" />
								Prendre une pause supplémentaire
							</button>
						{/if}
					</div>
				</div>

				<!-- Stop notification button -->
				<div class="pt-4 border-t border-zinc-800 space-y-2">
					<button
						on:click={handleStopSession}
						class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
					>
						<RotateCcw class="w-4 h-4" />
						Arrêter complètement la session
					</button>

					<button
						on:click={handleStopNotification}
						class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm transition-colors"
					>
						<Square class="w-4 h-4" />
						Arrêter seulement l'alerte
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure the modal is above everything else */
	:global([data-sveltekit-preload-data]) {
		z-index: 50;
	}
</style>
