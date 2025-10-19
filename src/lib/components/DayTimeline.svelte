<script lang="ts">
	import { taskStore } from '$lib/stores/taskStore';
	import type { Task } from '$lib/db';

	export let selectedDate: string;
	export let handleCreateTask: (date?: string, time?: string) => void;

	let viewMode: 'day' | 'week' = 'week';

	$: currentDate = new Date(selectedDate);

	// Pour la vue journalière
	const dayHours = Array.from({ length: 10 }, (_, i) => i + 9); // 9h à 18h inclus

	// Pour la vue hebdomadaire (lundi à vendredi uniquement)
	$: weekDays = Array.from({ length: 5 }, (_, i) => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() - date.getDay() + 1 + i); // Commence le lundi
		return date.toISOString().split('T')[0];
	});

	// Obtenir le numéro de la semaine
	function getWeekNumber(date: Date): number {
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	}

	$: weekNumber = getWeekNumber(currentDate);

	// Tâches pour la vue journalière
	$: dayScheduledTasks = $taskStore.tasks.filter(
		task => task.scheduledDate === selectedDate && task.scheduledStartTime
	);

	// Tâches pour la vue hebdomadaire
	let weekScheduledTasks: Task[] = [];
	$: if (selectedDate) {
		// This will trigger reactivity when selectedDate changes
		dayScheduledTasks = $taskStore.tasks.filter(
			task => task.scheduledDate === selectedDate && task.scheduledStartTime
		);
		weekScheduledTasks = $taskStore.tasks.filter(
			task => task.scheduledDate && weekDays.includes(task.scheduledDate)
		);
	}

	function getTasksForHour(hour: number): Task[] {
		return dayScheduledTasks.filter(task => {
			if (!task.scheduledStartTime) return false;
			const taskHour = parseInt(task.scheduledStartTime.split(':')[0]);
			return taskHour === hour;
		});
	}

	function formatHour(hour: number): string {
		return `${hour.toString().padStart(2, '0')}:00`;
	}

	function getTasksForDay(date: string): Task[] {
		return weekScheduledTasks.filter(task => task.scheduledDate === date);
	}

	function formatDay(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high': return 'bg-red-500/20 border-red-500';
			case 'medium': return 'bg-yellow-500/20 border-yellow-500';
			case 'low': return 'bg-green-500/20 border-green-500';
			default: return 'bg-zinc-500/20 border-zinc-500';
		}
	}
</script>

<div class="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
	<div class="p-4 border-b border-zinc-800">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-white">
				{#if viewMode === 'day'}
					Planning du {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
				{:else}
					Semaine {weekNumber} - {weekDays[0] ? new Date(weekDays[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''} au {weekDays[4] ? new Date(weekDays[4]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
				{/if}
			</h3>
			<div class="flex gap-2">
				<button
					on:click={() => viewMode = 'day'}
					class="px-3 py-1 rounded text-sm font-medium transition-colors {viewMode === 'day' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
				>
					Journée
				</button>
				<button
					on:click={() => viewMode = 'week'}
					class="px-3 py-1 rounded text-sm font-medium transition-colors {viewMode === 'week' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
				>
					Semaine
				</button>
			</div>
		</div>
	</div>

	<div class="max-h-[700px] overflow-y-auto">
		{#if viewMode === 'day'}
			<!-- Vue journalière -->
			{#each dayHours as hour}
				<div class="flex border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
				     on:click={() => handleCreateTask(selectedDate, `${hour.toString().padStart(2, '0')}:00`)}
				     role="button"
				     tabindex="0"
				     on:keydown={(e) => e.key === 'Enter' && handleCreateTask(selectedDate, `${hour.toString().padStart(2, '0')}:00`)}>
					<!-- Time Label -->
					<div class="w-20 flex-shrink-0 p-3 text-sm font-medium text-zinc-400 border-r border-zinc-800">
						{formatHour(hour)}
					</div>

					<!-- Tasks for this hour -->
					<div class="flex-1 p-2 min-h-[60px]">
						{#each getTasksForHour(hour) as task}
							<div class="mb-2 last:mb-0 p-3 rounded-lg border-l-4 {getPriorityColor(task.priority)}">
								<div class="flex items-start justify-between gap-2">
									<div class="flex-1">
										<div class="text-sm font-medium text-white">
											{task.title}
										</div>
										<div class="text-xs text-zinc-400 mt-1">
											{task.scheduledStartTime}
											{#if task.scheduledEndTime}
												- {task.scheduledEndTime}
											{/if}
										</div>
									</div>
									{#if task.completed}
										<span class="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
											✓
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<!-- Vue hebdomadaire en colonnes -->
			<div class="grid grid-cols-5 gap-4 p-4">
				{#each weekDays as date}
					<div class="bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden cursor-pointer hover:bg-zinc-700/50 transition-colors"
					     on:click={() => handleCreateTask(date)}
					     role="button"
					     tabindex="0"
					     on:keydown={(e) => e.key === 'Enter' && handleCreateTask(date)}>
						<!-- Day Header -->
						<div class="p-3 bg-zinc-800 border-b border-zinc-700">
							<div class="text-sm font-medium text-zinc-300 text-center">
								{formatDay(date)}
							</div>
						</div>

						<!-- Tasks for this day -->
						<div class="p-2 min-h-[200px] max-h-[400px] overflow-y-auto">
							{#each getTasksForDay(date) as task}
								<div class="mb-2 last:mb-0 p-2 rounded border-l-4 {getPriorityColor(task.priority)}">
									<div class="text-xs font-medium text-white">
										{task.title}
									</div>
									<div class="text-xs text-zinc-400 mt-1">
										{task.scheduledStartTime}
										{#if task.scheduledEndTime}
											- {task.scheduledEndTime}
										{/if}
									</div>
									{#if task.completed}
										<span class="text-xs px-1 py-0.5 bg-green-500/20 text-green-400 rounded mt-1 inline-block">
											✓
										</span>
									{/if}
								</div>
							{/each}
							{#if getTasksForDay(date).length === 0}
								<div class="text-xs text-zinc-500 text-center py-4">
									Aucune tâche
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>