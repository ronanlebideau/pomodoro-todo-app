<script lang="ts">
	import { pomodoroStore, formattedTime } from '$lib/stores/pomodoroStore';
	import { taskStore } from '$lib/stores/taskStore';
	import { Play, Pause, Square, Target, X } from 'lucide-svelte';

	// Local state for task selection and settings
	let showTaskSelector = false;
	let selectedTaskForTimer: number | null = null;

	$: isRunning = $pomodoroStore.state === 'focus' || $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break';
	$: isPaused = $pomodoroStore.state === 'paused';
	$: isIdle = $pomodoroStore.state === 'idle';

	// Get current task if associated
	$: currentTask = selectedTaskForTimer ? $taskStore.tasks.find(t => t.id === selectedTaskForTimer) : null;

	function handleStart() {
		pomodoroStore.startFocus(selectedTaskForTimer);
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

	function handleTaskSelection(taskId: number) {
		selectedTaskForTimer = taskId;
		showTaskSelector = false;
	}

	function handleRemoveTask() {
		selectedTaskForTimer = null;
	}

	function toggleTaskSelector() {
		showTaskSelector = !showTaskSelector;
	}

	// Available tasks for selection (active tasks only)
	$: availableTasks = $taskStore.tasks.filter(task => !task.completed);
</script>

<!-- Minimalist Timer Display -->
<div class="flex flex-col items-center justify-center h-full text-center">
	<!-- Task Association Section -->
	<div class="mb-8 w-full max-w-sm">
		{#if currentTask && (isRunning || isPaused)}
			<!-- Show current associated task -->
			<div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
				<div class="flex items-center gap-4 min-w-0 flex-1">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
						<Target class="w-5 h-5 text-blue-300" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="text-sm font-semibold text-white truncate">{currentTask.title}</div>
						<div class="text-xs text-white/60 mt-0.5">Tâche en cours</div>
					</div>
				</div>
				<button
					on:click={handleRemoveTask}
					class="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0 group"
					title="Dissocier cette tâche"
				>
					<X class="w-4 h-4 text-white/60 group-hover:text-white/80" />
				</button>
			</div>
		{:else}
			<!-- Task selector button -->
			<div class="relative">
				<button
					on:click={toggleTaskSelector}
					class="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-left group"
				>
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
						<Target class="w-5 h-5 text-white/60 group-hover:text-white/80" />
					</div>
					<div class="flex-1">
						{#if selectedTaskForTimer}
							{@const task = availableTasks.find(t => t.id === selectedTaskForTimer)}
							{#if task}
								<div class="text-sm font-semibold text-white truncate">{task.title}</div>
								<div class="text-xs text-white/60 mt-0.5">Tâche sélectionnée</div>
							{:else}
								<div class="text-sm text-white/60">Tâche sélectionnée</div>
							{/if}
						{:else}
							<div class="text-sm text-white/60">Sélectionner une tâche à associer</div>
						{/if}
					</div>
					<div class="text-white/40 group-hover:text-white/60 transition-colors">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</div>
				</button>

				<!-- Task dropdown -->
				{#if showTaskSelector}
					<div class="absolute top-full left-0 right-0 mt-3 bg-neutral-800 border border-neutral-700 rounded-xl p-2 z-50 max-h-64 overflow-hidden shadow-lg">
						<div class="max-h-60 overflow-y-auto">
							{#if availableTasks.length === 0}
								<div class="p-6 text-sm text-white/60 text-center">
									<div class="text-2xl mb-2">📝</div>
									Aucune tâche active disponible
								</div>
							{:else}
								{#each availableTasks as task}
									<button
										on:click={() => handleTaskSelection(task.id!)}
										class="w-full text-left p-4 hover:bg-white/10 transition-all duration-200 rounded-lg border-b border-white/5 last:border-b-0 group"
									>
										<div class="font-semibold text-white text-sm truncate mb-2">{task.title}</div>
										<div class="flex items-center gap-3">
											<span class="px-2 py-1 rounded-lg text-xs font-medium {task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/20' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20' : 'bg-green-500/20 text-green-300 border border-green-500/20'}">
												{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
											</span>
											{#if task.scheduledDate}
												<span class="text-xs text-white/50">
													{new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
												</span>
											{/if}
										</div>
									</button>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Time Display -->
	<div class="mb-8">
		<div class="text-6xl font-light text-white mb-2" style="font-family: 'Inter', sans-serif; font-weight: 200;">
			{$formattedTime}
		</div>
		<div class="text-sm text-neutral-400 uppercase tracking-wide">
			{#if $pomodoroStore.state === 'focus'}
				Focus
			{:else if $pomodoroStore.state === 'short-break'}
				Pause Courte
			{:else if $pomodoroStore.state === 'long-break'}
				Pause Longue
			{:else if isPaused}
				En Pause
			{:else}
				Prêt
			{/if}
		</div>
	</div>

	<!-- Session Counter -->
	<div class="mb-8 text-center">
		<div class="text-sm text-neutral-500">
			Session {$pomodoroStore.completedSessions + 1}
		</div>
		<div class="text-xs text-neutral-600">
			{$pomodoroStore.completedSessions} complétées
		</div>
	</div>

	<!-- Controls -->
	<div class="flex gap-4">
		{#if isIdle}
			<button
				on:click={handleStart}
				class="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors"
			>
				<Play class="w-5 h-5 text-white" />
			</button>
		{:else if isPaused}
			<button
				on:click={handleResume}
				class="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors"
			>
				<Play class="w-5 h-5 text-white" />
			</button>
			<button
				on:click={handleStop}
				class="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors"
			>
				<Square class="w-5 h-5 text-white" />
			</button>
		{:else if isRunning}
			<button
				on:click={handlePause}
				class="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors"
			>
				<Pause class="w-5 h-5 text-white" />
			</button>
			<button
				on:click={handleStop}
				class="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center transition-colors"
			>
				<Square class="w-5 h-5 text-white" />
			</button>
		{/if}
	</div>
</div>
