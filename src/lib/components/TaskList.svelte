<script lang="ts">
	import { taskStore } from '$lib/stores/taskStore';
	import { Check, Clock, Edit, Trash2, Play, Square } from 'lucide-svelte';
	import type { Task } from '$lib/db';

	export let onEditTask: (task: Task) => void;
	export let onSelectTask: (taskId: number) => void;

	let filter: 'all' | 'active' | 'completed' = 'all';
	let sortBy: 'created' | 'priority' | 'scheduled' = 'created';

	$: filteredTasks = $taskStore.tasks.filter(task => {
		if (filter === 'active') return !task.completed;
		if (filter === 'completed') return task.completed;
		return true;
	}).sort((a, b) => {
		if (sortBy === 'priority') {
			const priorityOrder = { high: 0, medium: 1, low: 2 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		}
		if (sortBy === 'scheduled') {
			if (!a.scheduledDate && !b.scheduledDate) return 0;
			if (!a.scheduledDate) return 1;
			if (!b.scheduledDate) return -1;
			return a.scheduledDate.localeCompare(b.scheduledDate);
		}
		return b.createdAt - a.createdAt;
	});

	async function handleToggleComplete(id: number) {
		await taskStore.toggleComplete(id);
	}

	async function handleDelete(id: number) {
		if (confirm('Supprimer cette tâche ?')) {
			await taskStore.deleteTask(id);
		}
	}

	async function handleStartTracking(taskId: number) {
		await taskStore.startTimeTracking(taskId);
	}

	async function handleStopTracking() {
		await taskStore.stopTimeTracking();
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high': return 'text-red-500';
			case 'medium': return 'text-yellow-500';
			case 'low': return 'text-green-500';
			default: return 'text-zinc-500';
		}
	}

	function getPriorityBg(priority: string) {
		switch (priority) {
			case 'high': return 'bg-red-500/10 border-red-500/20';
			case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
			case 'low': return 'bg-green-500/10 border-green-500/20';
			default: return 'bg-zinc-500/10 border-zinc-500/20';
		}
	}
</script>

<div class="space-y-4">
	<!-- Filters and Sort -->
	<div class="flex flex-wrap gap-4 items-center justify-between">
		<div class="flex gap-2">
			<button
				on:click={() => filter = 'all'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'all' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
			>
				Toutes
			</button>
			<button
				on:click={() => filter = 'active'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'active' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
			>
				Actives
			</button>
			<button
				on:click={() => filter = 'completed'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'completed' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
			>
				Complétées
			</button>
		</div>

		<select
			bind:value={sortBy}
			class="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
		>
			<option value="created">Trier par date</option>
			<option value="priority">Trier par priorité</option>
			<option value="scheduled">Trier par planning</option>
		</select>
	</div>

	<!-- Task List -->
	<div class="space-y-3">
		{#if filteredTasks.length === 0}
			<div class="text-center py-12 text-zinc-500">
				Aucune tâche {filter === 'active' ? 'active' : filter === 'completed' ? 'complétée' : ''}
			</div>
		{:else}
			{#each filteredTasks as task (task.id)}
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
					<div class="flex items-start gap-4">
						<!-- Checkbox -->
						<button
							on:click={() => handleToggleComplete(task.id!)}
							class="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors {task.completed ? 'bg-green-600 border-green-600' : 'border-zinc-600 hover:border-zinc-500'}"
						>
							{#if task.completed}
								<Check class="w-4 h-4 text-white" />
							{/if}
						</button>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1">
									<h3 class="text-white font-medium {task.completed ? 'line-through text-zinc-500' : ''}">
										{task.title}
									</h3>
									{#if task.description}
										<p class="text-sm text-zinc-400 mt-1">
											{task.description}
										</p>
									{/if}

									<!-- Meta Info -->
									<div class="flex flex-wrap gap-3 mt-3 text-xs">
										<!-- Priority -->
										<span class="px-2 py-1 rounded border {getPriorityBg(task.priority)}">
											<span class={getPriorityColor(task.priority)}>
												{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
											</span>
										</span>

										<!-- Scheduled Time -->
										{#if task.scheduledDate}
											<span class="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
												{new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
												{#if task.scheduledStartTime}
													• {task.scheduledStartTime}
													{#if task.scheduledEndTime}
														- {task.scheduledEndTime}
													{/if}
												{/if}
											</span>
										{/if}

										<!-- Tags -->
										{#each task.tags as tag}
											<span class="px-2 py-1 rounded bg-zinc-800 text-zinc-400">
												#{tag}
											</span>
										{/each}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									{#if $taskStore.activeTimeLog?.taskId === task.id}
										<button
											on:click={handleStopTracking}
											class="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
											title="Arrêter le tracking"
										>
											<Square class="w-4 h-4" />
										</button>
									{:else if !task.completed}
										<button
											on:click={() => handleStartTracking(task.id!)}
											class="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
											title="Démarrer le tracking"
										>
											<Play class="w-4 h-4" />
										</button>
										<button
											on:click={() => onSelectTask(task.id!)}
											class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
											title="Utiliser pour Pomodoro"
										>
											<Clock class="w-4 h-4" />
										</button>
									{/if}
									<button
										on:click={() => onEditTask(task)}
										class="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
										title="Modifier"
									>
										<Edit class="w-4 h-4" />
									</button>
									<button
										on:click={() => handleDelete(task.id!)}
										class="p-2 bg-zinc-700 hover:bg-red-600 text-white rounded-lg transition-colors"
										title="Supprimer"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
