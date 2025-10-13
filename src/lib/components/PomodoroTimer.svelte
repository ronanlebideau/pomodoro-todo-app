<script lang="ts">
	import { onMount } from 'svelte';
	import { pomodoroStore, formattedTime, pomodoroProgress } from '$lib/stores/pomodoroStore';
	import { taskStore } from '$lib/stores/taskStore';
	import { Play, Pause, Square, Coffee, Brain, ChevronDown } from 'lucide-svelte';

	export let taskId: number | null = null;

	// État pour la sélection de durée
	let showDurationPicker = false;
	let tempFocusDuration = 25;
	let tempShortBreakDuration = 5;
	let tempLongBreakDuration = 15;

	// État pour la sélection de tâche
	let showTaskDropdown = false;
	let selectedTaskId: number | null = taskId;

	onMount(() => {
		if ('Notification' in globalThis && Notification.permission === 'default') {
			Notification.requestPermission();
		}
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

	function handleTimerClick() {
		if (isIdle) {
			showDurationPicker = !showDurationPicker;
		}
	}

	function handleDurationSelect(type: 'focus' | 'short' | 'long', minutes: number) {
		const configUpdate: any = {};
		if (type === 'focus') {
			configUpdate.focusDuration = minutes;
			tempFocusDuration = minutes;
		} else if (type === 'short') {
			configUpdate.shortBreakDuration = minutes;
			tempShortBreakDuration = minutes;
		} else if (type === 'long') {
			configUpdate.longBreakDuration = minutes;
			tempLongBreakDuration = minutes;
		}
		pomodoroStore.updateConfig(configUpdate);
		showDurationPicker = false;
	}

	function handleDurationPickerClose() {
		showDurationPicker = false;
		// Remettre les valeurs temporaires aux valeurs actuelles
		tempFocusDuration = $pomodoroStore.config.focusDuration;
		tempShortBreakDuration = $pomodoroStore.config.shortBreakDuration;
		tempLongBreakDuration = $pomodoroStore.config.longBreakDuration;
	}

	function handleTaskSelect(taskId: number | null) {
		selectedTaskId = taskId;
		showTaskDropdown = false;
	}

	function handleTaskDropdownToggle() {
		showTaskDropdown = !showTaskDropdown;
		showDurationPicker = false; // Fermer l'autre dropdown si ouvert
	}

	// Synchroniser les valeurs temporaires avec les valeurs actuelles
	$: if ($pomodoroStore.config) {
		tempFocusDuration = $pomodoroStore.config.focusDuration;
		tempShortBreakDuration = $pomodoroStore.config.shortBreakDuration;
		tempLongBreakDuration = $pomodoroStore.config.longBreakDuration;
	}

	$: shouldShowLongBreak = $pomodoroStore.completedSessions > 0 &&
		$pomodoroStore.completedSessions % $pomodoroStore.config.sessionsBeforeLongBreak === 0;

	// Récupérer la tâche sélectionnée
	$: selectedTask = selectedTaskId ? $taskStore.tasks.find(t => t.id === selectedTaskId) : null;
</script>

<div class="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
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

		<!-- Time Text / Duration Picker -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			{#if showDurationPicker}
				<!-- Duration Picker Interface -->
				<div class="bg-zinc-800 rounded-lg p-4 border border-zinc-700 shadow-lg">
					<div class="text-center mb-4">
						<h3 class="text-white font-medium">Choisir la durée</h3>
					</div>

					<!-- Focus Duration -->
					<div class="mb-3">
						<label class="block text-xs text-zinc-400 mb-1">Focus</label>
						<div class="flex gap-1">
							{#each [15, 25, 30, 45, 60] as minutes}
								<button
									class="px-2 py-1 text-xs rounded {tempFocusDuration === minutes ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'} transition-colors"
									on:click={() => handleDurationSelect('focus', minutes)}
								>
									{minutes}m
								</button>
							{/each}
						</div>
					</div>

					<!-- Break Durations -->
					<div class="mb-3">
						<label class="block text-xs text-zinc-400 mb-1">Pause courte</label>
						<div class="flex gap-1">
							{#each [3, 5, 10, 15] as minutes}
								<button
									class="px-2 py-1 text-xs rounded {tempShortBreakDuration === minutes ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'} transition-colors"
									on:click={() => handleDurationSelect('short', minutes)}
								>
									{minutes}m
								</button>
							{/each}
						</div>
					</div>

					<div class="mb-3">
						<label class="block text-xs text-zinc-400 mb-1">Pause longue</label>
						<div class="flex gap-1">
							{#each [10, 15, 20, 30] as minutes}
								<button
									class="px-2 py-1 text-xs rounded {tempLongBreakDuration === minutes ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'} transition-colors"
									on:click={() => handleDurationSelect('long', minutes)}
								>
									{minutes}m
								</button>
							{/each}
						</div>
					</div>

					<!-- Close button -->
					<button
						class="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-sm transition-colors"
						on:click={handleDurationPickerClose}
					>
						Annuler
					</button>
				</div>
			{:else}
				<!-- Normal Time Display (clickable when idle) -->
				<button
					class="flex flex-col items-center justify-center w-full h-full {isIdle ? 'cursor-pointer hover:bg-zinc-800/20 rounded-full transition-colors' : ''}"
					class:opacity-50={!isIdle}
					on:click={handleTimerClick}
					disabled={!isIdle}
				>
					<div class="text-6xl font-bold text-white font-mono">
						{$formattedTime}
					</div>
					<div class="text-sm text-zinc-400 mt-2">
						{#if isFocus}
							Focus
						{:else if $pomodoroStore.state === 'short-break'}
							Pause courte
						{:else if $pomodoroStore.state === 'long-break'}
							Pause longue
						{:else if isPaused}
							En pause
						{:else}
							Prêt
						{/if}
					</div>
				</button>
			{/if}
		</div>
	</div>

	<!-- Session Counter -->
	<div class="flex items-center gap-2">
		<Brain class="w-4 h-4 text-zinc-400" />
		<span class="text-sm text-zinc-400">
			{$pomodoroStore.completedSessions} session{$pomodoroStore.completedSessions !== 1 ? 's' : ''} complétée{$pomodoroStore.completedSessions !== 1 ? 's' : ''}
		</span>
	</div>

	<!-- Task Selection Dropdown -->
	<div class="relative w-full max-w-xs">
		<button
			class="flex items-center justify-between w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:bg-zinc-700 transition-colors"
			on:click={handleTaskDropdownToggle}
			disabled={isRunning}
		>
			<span class="text-sm truncate">
				{#if selectedTask}
					{selectedTask.title}
				{:else}
					Sélectionner une tâche
				{/if}
			</span>
			<ChevronDown class="w-4 h-4 {showTaskDropdown ? 'rotate-180' : ''} transition-transform" />
		</button>

		{#if showTaskDropdown}
			<div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
				<button
					class="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
					on:click={() => handleTaskSelect(null)}
				>
					<span class="text-sm text-zinc-400">Aucune tâche</span>
				</button>
				{#each $taskStore.tasks.filter(task => !task.completed) as task}
					<button
						class="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
						on:click={() => handleTaskSelect(task.id ?? null)}
					>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full bg-zinc-500"></div>
							<span class="text-sm truncate">{task.title}</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Controls -->
	<div class="flex gap-3">
		{#if isIdle}
			<button
				on:click={handleStart}
				class="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
			>
				<Play class="w-5 h-5" />
				Démarrer Focus
			</button>
		{:else if isPaused}
			<button
				on:click={handleResume}
				class="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
			>
				<Play class="w-5 h-5" />
				Reprendre
			</button>
			<button
				on:click={handleStop}
				class="flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
			>
				<Square class="w-5 h-5" />
				Arrêter
			</button>
		{:else if isRunning}
			<button
				on:click={handlePause}
				class="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
			>
				<Pause class="w-5 h-5" />
				Pause
			</button>
			<button
				on:click={handleStop}
				class="flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
			>
				<Square class="w-5 h-5" />
				Arrêter
			</button>
		{/if}
	</div>

	<!-- Break Buttons (shown when idle or after completing focus) -->
	{#if isIdle && $pomodoroStore.completedSessions > 0}
		<div class="flex gap-3 pt-4 border-t border-zinc-800 w-full justify-center">
			<button
				on:click={() => handleStartBreak(false)}
				class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
			>
				<Coffee class="w-4 h-4" />
				Pause courte (5 min)
			</button>
			{#if shouldShowLongBreak}
				<button
					on:click={() => handleStartBreak(true)}
					class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
				>
					<Coffee class="w-4 h-4" />
					Pause longue (15 min)
				</button>
			{/if}
		</div>
	{/if}
</div>
