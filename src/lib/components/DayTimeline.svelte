<script lang="ts">
	import { taskStore } from '$lib/stores/taskStore';
	import type { Task } from '$lib/db';

	export let selectedDate: string;

	$: scheduledTasks = $taskStore.tasks.filter(
		task => task.scheduledDate === selectedDate && task.scheduledStartTime
	);

	const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9h à 18h

	function getTasksForHour(hour: number): Task[] {
		return scheduledTasks.filter(task => {
			if (!task.scheduledStartTime) return false;
			const taskHour = parseInt(task.scheduledStartTime.split(':')[0]);
			return taskHour === hour;
		});
	}

	function formatHour(hour: number): string {
		return `${hour.toString().padStart(2, '0')}:00`;
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
		<h3 class="text-lg font-semibold text-white">
			Planning du {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
		</h3>
		<p class="text-sm text-zinc-400 mt-1">
			Horaires de journée (9h - 18h)
		</p>
	</div>

	<div class="max-h-[600px] overflow-y-auto">
		{#each hours as hour}
			<div class="flex border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
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
	</div>
</div>
