<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import X from 'lucide-svelte/icons/x.svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left.svelte';
	import ChevronRight from 'lucide-svelte/icons/chevron-right.svelte';

	const dispatch = createEventDispatcher();

	export let currentDate: string = '';
	export let isOpen: boolean = false;

	let selectedDate: Date = currentDate ? new Date(currentDate + 'T12:00:00') : new Date();
	let currentMonth: Date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

	// Initialize dates only after component mounts to avoid SSR issues
	onMount(() => {
		if (!currentDate) {
			const today = new Date();
			selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		}
	});

	function formatDateForInput(dateString: string): string {
		if (!dateString) return '';
		const date = new Date(dateString + 'T12:00:00'); // Ajouter une heure fixe pour éviter les problèmes de fuseau horaire
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
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

	function selectDate(date: Date) {
		selectedDate = new Date(date);
		// Éviter le décalage de fuseau horaire en formatant directement
		const year = selectedDate.getFullYear();
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
		const day = String(selectedDate.getDate()).padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;
		dispatch('dateChange', dateString);
		closePicker();
	}

	function goToPreviousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function goToNextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function goToToday() {
		const today = new Date();
		selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	}

	// Générer les jours du mois
	$: monthDays = (() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		// Premier jour du mois
		const firstDay = new Date(year, month, 1);
		// Dernier jour du mois
		const lastDay = new Date(year, month + 1, 0);

		// Jour de la semaine du premier jour (0 = dimanche)
		const startDayOfWeek = firstDay.getDay();

		const days = [];

		// Ajouter les jours du mois précédent pour compléter la grille
		for (let i = 0; i < startDayOfWeek; i++) {
			const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
			days.push({
				date: prevDate,
				isCurrentMonth: false,
				isSelected: false,
				isToday: false
			});
		}

		// Ajouter les jours du mois actuel
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const isToday = date.getDate() === new Date().getDate() &&
				date.getMonth() === new Date().getMonth() &&
				date.getFullYear() === new Date().getFullYear();
			const isSelected = selectedDate &&
				date.getDate() === selectedDate.getDate() &&
				date.getMonth() === selectedDate.getMonth() &&
				date.getFullYear() === selectedDate.getFullYear();

			days.push({
				date,
				isCurrentMonth: true,
				isSelected,
				isToday
			});
		}

		// Ajouter les jours du mois suivant pour compléter la grille (42 jours total)
		const remainingDays = 42 - days.length;
		for (let day = 1; day <= remainingDays; day++) {
			const nextDate = new Date(year, month + 1, day);
			days.push({
				date: nextDate,
				isCurrentMonth: false,
				isSelected: false,
				isToday: false
			});
		}

		return days;
	})();

	// Noms des jours de la semaine
	const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
	const monthNames = [
		'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
		'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
	];
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
		<div class="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-2xl min-w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
			<!-- Arrow pointing up -->
			<div class="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-zinc-700"></div>
			<div class="absolute -top-1 left-4 w-0 h-0 border-l-3 border-r-3 border-b-3 border-l-transparent border-r-transparent border-b-zinc-900"></div>

			<div class="flex items-center justify-between mb-4">
				<h4 class="text-sm font-medium text-white">Sélectionner une date</h4>
				<button
					on:click={closePicker}
					class="p-1 hover:bg-zinc-800 rounded transition-colors"
					title="Fermer"
				>
					<X class="w-4 h-4 text-zinc-400" />
				</button>
			</div>

			<!-- Calendar Header -->
			<div class="flex items-center justify-between mb-4">
				<button
					on:click={goToPreviousMonth}
					class="p-1 hover:bg-zinc-800 rounded transition-colors"
				>
					<ChevronLeft class="w-4 h-4 text-zinc-400" />
				</button>

				<h3 class="text-white font-medium">
					{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
				</h3>

				<button
					on:click={goToNextMonth}
					class="p-1 hover:bg-zinc-800 rounded transition-colors"
				>
					<ChevronRight class="w-4 h-4 text-zinc-400" />
				</button>
			</div>

			<!-- Week Days Header -->
			<div class="grid grid-cols-7 gap-1 mb-2">
				{#each weekDays as dayName}
					<div class="text-center text-xs text-zinc-400 py-1">
						{dayName}
					</div>
				{/each}
			</div>

			<!-- Calendar Grid -->
			<div class="grid grid-cols-7 gap-1">
				{#each monthDays as day}
					<button
						on:click={() => selectDate(day.date)}
						class="w-8 h-8 text-sm rounded hover:bg-zinc-800 transition-colors flex items-center justify-center
							{day.isToday ? 'bg-blue-600 text-white' : ''}
							{day.isSelected ? 'bg-red-600 text-white' : ''}
							{!day.isCurrentMonth ? 'text-zinc-600' : 'text-white'}
							{day.isCurrentMonth && !day.isToday && !day.isSelected ? 'hover:bg-zinc-800' : ''}"
						disabled={!day.isCurrentMonth}
					>
						{day.date.getDate()}
					</button>
				{/each}
			</div>

			<!-- Today Button -->
			<div class="mt-4 pt-3 border-t border-zinc-700">
				<button
					on:click={goToToday}
					class="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded transition-colors"
				>
					Aujourd'hui
				</button>
			</div>
		</div>
	</div>
{/if}
