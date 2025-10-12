<script lang="ts">
	import { taskStore } from '$lib/stores/taskStore';
	import type { Task } from '$lib/db';

	export let selectedDate: string;

	// Générer les 7 jours de la semaine (lundi au dimanche)
	$: startOfWeek = getStartOfWeek(new Date(selectedDate));
	$: weekDays = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(startOfWeek);
		date.setDate(startOfWeek.getDate() + i);
		return date;
	});

	function getStartOfWeek(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + 1; // Ajuster pour commencer par lundi
		return new Date(d.setDate(diff));
	}

	function getTasksForDay(date: Date): Task[] {
		const dateString = date.toISOString().split('T')[0];
		return $taskStore.tasks.filter(
			task => task.scheduledDate === dateString && task.scheduledStartTime
		);
	}

	function formatDayHeader(date: Date): string {
		return date.toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high': return 'bg-red-500/20 border-red-500 text-red-400';
			case 'medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
			case 'low': return 'bg-green-500/20 border-green-500 text-green-400';
			default: return 'bg-zinc-500/20 border-zinc-500 text-zinc-400';
		}
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
</script>

<div class="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
	<div class="p-4 border-b border-zinc-800">
		<h3 class="text-lg font-semibold text-white">
			Semaine du {weekDays[0].toLocaleDateString('fr-FR')} au {weekDays[6].toLocaleDateString('fr-FR')}
		</h3>
	</div>

	<div class="overflow-x-auto">
		<!-- Header with days -->
		<div class="grid grid-cols-8 border-b border-zinc-800">
			<div class="p-3 text-sm font-medium text-zinc-400 border-r border-zinc-800">
				Heure
			</div>
			{#each weekDays as day}
				<div class="p-3 text-sm font-medium text-center border-r border-zinc-800 last:border-r-0 {isToday(day) ? 'bg-zinc-800 text-white' : 'text-zinc-400'}">
					<div class="font-semibold">{formatDayHeader(day)}</div>
					<div class="text-xs mt-1">
						{#if isToday(day)}
							Aujourd'hui
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Time slots (heures de travail uniquement : 9h-18h) -->
		<div class="max-h-[600px] overflow-y-auto">
			{#each Array.from({ length: 10 }, (_, i) => i + 9) as hour}
				<div class="grid grid-cols-8 border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors min-h-[80px]">
					<!-- Time column -->
					<div class="p-3 text-sm text-zinc-400 border-r border-zinc-800 flex items-start justify-center pt-4">
						{hour.toString().padStart(2, '0')}:00
					</div>

					<!-- Day columns -->
					{#each weekDays as day}
						<div class="p-2 border-r border-zinc-800 last:border-r-0 relative">
							{#each getTasksForDay(day) as task}
								{#if parseInt(task.scheduledStartTime?.split(':')[0] || '0') === hour}
									<div class="mb-1 p-2 rounded text-xs border-l-2 {getPriorityColor(task.priority)}">
										<div class="font-medium text-white truncate">
											{task.title}
										</div>
										<div class="text-zinc-400 mt-1">
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
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
