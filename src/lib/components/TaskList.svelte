<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '$lib/stores/taskStore';
	import { pomodoroStore } from '$lib/stores/pomodoroStore';
	import { Check, Edit, Trash2, Play, Pause } from 'lucide-svelte';
	import type { Task } from '$lib/db';

	export let onEditTask: (task: Task) => void;
	export let onStartPomodoro: (taskId: number) => void;
	export let onPausePomodoro: () => void;
	export let isTimerRunning: boolean;
	export let currentTaskId: number | null;

	let filter: 'all' | 'active' | 'completed' = 'active';
	let priorityDropdownOpen: number | null = null;

	async function handleToggleComplete(id: number) {
		await taskStore.toggleComplete(id);
	}

	async function handleDelete(id: number) {
		if (confirm('Supprimer cette tâche ?')) {
			await taskStore.deleteTask(id);
		}
	}

	async function handleStartPomodoro(taskId: number) {
		onStartPomodoro(taskId);
	}

	async function togglePriorityDropdown(taskId: number) {
		priorityDropdownOpen = priorityDropdownOpen === taskId ? null : taskId;
	}

	async function changePriority(taskId: number, newPriority: 'low' | 'medium' | 'high') {
		await taskStore.updateTask(taskId, { priority: newPriority });
		priorityDropdownOpen = null;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (priorityDropdownOpen && !(event.target as Element).closest('.priority-dropdown')) {
			priorityDropdownOpen = null;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	$: filteredTasks = $taskStore.tasks.filter(task => {
		if (filter === 'active') return !task.completed;
		if (filter === 'completed') return task.completed;
		return true;
	});
</script>

<!-- Minimalist Task List -->
<div class="h-full flex flex-col">
	<!-- Filter Tabs -->
	<div class="border-b border-neutral-700 p-4">
		<div class="flex gap-2">
			<button
				on:click={() => filter = 'active'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'active' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}"
			>
				Actives
			</button>
			<button
				on:click={() => filter = 'completed'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'completed' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}"
			>
				Terminées
			</button>
			<button
				on:click={() => filter = 'all'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'all' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}"
			>
				Toutes
			</button>
		</div>
	</div>

	<!-- Task List -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if filteredTasks.length === 0}
			<div class="text-center py-16 text-neutral-500">
				<div class="text-4xl mb-4">📝</div>
				<p class="text-lg font-medium">Aucune tâche {filter === 'active' ? 'active' : filter === 'completed' ? 'terminée' : ''}</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredTasks as task (task.id)}
					<div class="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:bg-neutral-750 transition-colors {currentTaskId === task.id && (isTimerRunning || $pomodoroStore.state === 'paused') ? 'ring-2 ring-blue-500 border-blue-500' : ''}">
						<div class="flex items-start gap-4">
							<!-- Checkbox -->
							<button
								on:click={() => handleToggleComplete(task.id!)}
								class="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors {task.completed ? 'bg-green-600 border-green-600' : 'border-neutral-600 hover:border-neutral-400'}"
							>
								{#if task.completed}
									<Check class="w-4 h-4 text-white" />
								{/if}
							</button>

							<!-- Content -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<h3 class="text-white font-medium {task.completed ? 'line-through text-neutral-400' : ''} mb-2">
											{task.title}
											{#if currentTaskId === task.id && (isTimerRunning || $pomodoroStore.state === 'paused')}
												<span class="inline-flex items-center gap-2 ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
													<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
													En cours
												</span>
											{/if}
										</h3>
										{#if task.description}
											<p class="text-neutral-400 text-sm leading-relaxed mb-3">
												{task.description}
											</p>
										{/if}

										<!-- Meta Info -->
										<div class="flex flex-wrap gap-2 mb-3">
											<!-- Priority -->
											<div class="relative priority-dropdown">
												<button
													on:click={() => togglePriorityDropdown(task.id!)}
													class="px-2 py-1 rounded text-xs font-medium transition-colors {task.priority === 'high' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'}"
												>
													{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
													<svg class="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
													</svg>
												</button>

												{#if priorityDropdownOpen === task.id}
													<div class="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg p-1 z-50 min-w-[120px] priority-dropdown">
														<button
															on:click={() => changePriority(task.id!, 'low')}
															class="w-full text-left px-3 py-2 text-xs rounded hover:bg-neutral-700 transition-colors {task.priority === 'low' ? 'bg-green-500/20 text-green-300' : 'text-neutral-300'}"
														>
															Priorité basse
														</button>
														<button
															on:click={() => changePriority(task.id!, 'medium')}
															class="w-full text-left px-3 py-2 text-xs rounded hover:bg-neutral-700 transition-colors {task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'text-neutral-300'}"
														>
															Priorité moyenne
														</button>
														<button
															on:click={() => changePriority(task.id!, 'high')}
															class="w-full text-left px-3 py-2 text-xs rounded hover:bg-neutral-700 transition-colors {task.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'text-neutral-300'}"
														>
															Priorité haute
														</button>
													</div>
												{/if}
											</div>

											<!-- Tags -->
											{#each task.tags as tag}
												<span class="px-2 py-1 rounded text-xs font-medium bg-neutral-700 text-neutral-300">
													#{tag}
												</span>
											{/each}
										</div>
									</div>

									<!-- Actions -->
									<div class="flex gap-2">
										{#if !task.completed}
											{#if isTimerRunning && currentTaskId === task.id}
												<button
													on:click={onPausePomodoro}
													class="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors"
													title="Mettre en pause"
												>
													<Pause class="w-4 h-4" />
												</button>
											{:else}
												<button
													on:click={() => onStartPomodoro(task.id!)}
													class="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
													title="Démarrer le timer"
												>
													<Play class="w-4 h-4" />
												</button>
											{/if}
										{/if}
										<button
											on:click={() => onEditTask(task)}
											class="p-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-400 hover:text-white rounded-lg transition-colors"
											title="Modifier"
										>
											<Edit class="w-4 h-4" />
										</button>
										<button
											on:click={() => handleDelete(task.id!)}
											class="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
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
			</div>
		{/if}
	</div>
</div>
