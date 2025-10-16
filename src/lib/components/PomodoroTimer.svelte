<script lang="ts">
	import { onMount } from 'svelte';
	import { pomodoroStore, formattedTime, pomodoroProgress } from '$lib/stores/pomodoroStore';
	import { taskStore } from '$lib/stores/taskStore';
	import { Play, Pause, Square, Coffee, Brain } from 'lucide-svelte';

	export let taskId: number | null = null;

	// État pour la sélection de tâche
	let showTaskDropdown = false;
	let selectedTaskId: number | null = taskId;

	// Filtrer les tâches non complétées
	$: activeTasks = $taskStore.tasks.filter(task => !task.completed);

	onMount(() => {
		if ('Notification' in globalThis && Notification.permission === 'default') {
			Notification.requestPermission();
		}

		// Définir les durées par défaut
		pomodoroStore.updateConfig({
			focusDuration: 25,
			shortBreakDuration: 5,
			longBreakDuration: 15
		});
	});

	$: isRunning = $pomodoroStore.state === 'focus' || $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break';
	$: isPaused = $pomodoroStore.state === 'paused';
	$: isIdle = $pomodoroStore.state === 'idle';
	$: isFocus = $pomodoroStore.state === 'focus';
	$: isBreak = $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break';

	function handleStart() {
		pomodoroStore.startFocus(selectedTaskId);
	}

	function handlePause() {
		pomodoroStore.pause();
	}

	function handleResume() {
		pomodoroStore.resume();
	}

	function handleStop() {
		pomodoroStore.stop();
	}

	function handleStartBreak(isLong: boolean = false) {
		pomodoroStore.startBreak(isLong);
	}

	function handleTaskSelect(taskId: number | null) {
		selectedTaskId = taskId;
		showTaskDropdown = false;
	}

	function handleTaskDropdownToggle() {
		showTaskDropdown = !showTaskDropdown;
	}

	// Récupérer la tâche sélectionnée
	$: selectedTask = selectedTaskId ? $taskStore.tasks.find(t => t.id === selectedTaskId) : null;

	$: shouldShowLongBreak = $pomodoroStore.completedSessions > 0 &&
		$pomodoroStore.completedSessions % $pomodoroStore.config.sessionsBeforeLongBreak === 0;
</script>

<div class="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md">
	<!-- Timer Display -->
	<div class="relative w-64 h-64">
		<!-- Progress Circle -->
		<svg class="w-full h-full transform -rotate-90">
			<circle
				cx="128"
				cy="128"
				r="120"
				stroke="currentColor"
				stroke-width="8"
				fill="none"
				class="text-zinc-800"
			/>
			<circle
				cx="128"
				cy="128"
				r="120"
				stroke="currentColor"
				stroke-width="8"
				fill="none"
				class={isFocus ? 'text-red-500' : isBreak ? 'text-green-500' : 'text-zinc-700'}
				stroke-dasharray={2 * Math.PI * 120}
				stroke-dashoffset={2 * Math.PI * 120 * (1 - $pomodoroProgress / 100)}
				class:transition-all={isRunning}
				style="transition-duration: 1s;"
			/>
		</svg>

		<!-- Time Display -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<span class="text-5xl font-bold text-white">{$formattedTime}</span>
				<span class="mt-2 text-sm text-zinc-400">
					{#if isFocus}
						Travail en cours
					{:else if $pomodoroStore.state === 'short-break'}
						Pause courte
					{:else if $pomodoroStore.state === 'long-break'}
						Pause longue
					{:else if isPaused}
						En pause
					{:else}
						Prêt à travailler
					{/if}
				</span>
			</div>
		</div>
	</div>

	<!-- Task Selection Dropdown -->
	<div class="relative w-full max-w-xs">
		<button
			class="flex items-center justify-between w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:bg-zinc-700 transition-colors"
			on:click={handleTaskDropdownToggle}
			disabled={isRunning}
			class:opacity-50={isRunning}
			class:cursor-not-allowed={isRunning}
		>
			<span class="truncate">
				{#if selectedTask}
					{selectedTask.title}
				{:else}
					Sélectionner une tâche (optionnel)
				{/if}
			</span>
			<svg class="w-4 h-4 ml-2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if showTaskDropdown}
			<div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg">
				<div class="max-h-48 overflow-y-auto">
					<button
						class="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors"
						on:click={() => handleTaskSelect(null)}
					>
						Aucune tâche
					</button>
					{#each activeTasks as task}
						<button
							class="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors cursor-pointer"
							on:click={() => handleTaskSelect(task.id as number | null)}
						>
							{task.title}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Controls -->
	<div class="flex flex-col items-center gap-4 w-full">
		{#if isRunning || isPaused}
			<div class="flex gap-4">
				{#if isPaused}
					<button
						on:click={handleResume}
						class="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
						title="Reprendre"
					>
						<Play class="w-6 h-6" />
					</button>
				{:else}
					<button
						on:click={handlePause}
						class="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
						title="Mettre en pause"
					>
						<Pause class="w-6 h-6" />
					</button>
				{/if}

				<button
					on:click={handleStop}
					class="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
					title="Arrêter"
				>
					<Square class="w-5 h-5" />
				</button>
			</div>
		{:else}
			<!-- Bouton Focus (pleine largeur) -->
			<button
				on:click={handleStart}
				class="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
			>
				<Brain class="w-5 h-5" />
				<span>Démarrer un Focus</span>
			</button>

			<!-- Boutons Pause (côte à côte) -->
			<div class="flex gap-4 w-full">
				<button
					on:click={() => handleStartBreak(false)}
					class="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
				>
					<Coffee class="w-5 h-5" />
					<span>Pause Courte</span>
				</button>

				<button
					on:click={() => handleStartBreak(true)}
					class="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
				>
					<Coffee class="w-5 h-5" />
					<span>Pause Longue</span>
				</button>
			</div>
		{/if}
	</div>
</div>
