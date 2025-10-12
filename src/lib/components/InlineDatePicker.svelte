<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let currentDate: string = '';
	export let isOpen: boolean = false;

	let inputElement: HTMLInputElement;

	function formatDateForInput(dateString: string): string {
		if (!dateString) return '';
		return new Date(dateString).toISOString().split('T')[0];
	}

	function handleDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newDate = target.value;
		dispatch('dateChange', newDate);
		closePicker();
	}

	function closePicker() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closePicker();
		}
	}

	// Auto-focus and open calendar when component opens
	function openCalendar() {
		if (inputElement) {
			inputElement.focus();
			// Trigger click to open native calendar
			inputElement.click();
		}
	}

	// Call openCalendar when isOpen becomes true
	$: if (isOpen && inputElement) {
		setTimeout(openCalendar, 100);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="relative inline-block">
		<!-- Overlay to capture clicks outside -->
		<div
			class="fixed inset-0 z-40"
			on:click={closePicker}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Enter' && closePicker()}
		></div>

		<!-- Date Picker Container -->
		<div class="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl min-w-[280px]">
			<div class="flex items-center justify-between mb-3">
				<h4 class="text-sm font-medium text-white">Sélectionner une date</h4>
				<button
					on:click={closePicker}
					class="p-1 hover:bg-zinc-800 rounded transition-colors"
					title="Fermer"
				>
					<X class="w-4 h-4 text-zinc-400" />
				</button>
			</div>

			<input
				bind:this={inputElement}
				type="date"
				value={formatDateForInput(currentDate)}
				on:change={handleDateChange}
				class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>
	</div>
{/if}
