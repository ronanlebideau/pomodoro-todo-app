<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '$lib/stores/taskStore';
	import { Check, Clock, Edit, Trash2, Play, Square, Calendar, Plus } from 'lucide-svelte';
	import type { Task } from '$lib/db';
	import InlineDatePicker from './InlineDatePicker.svelte';

	export let onEditTask: (task: Task) => void;

	let filter: 'active' | 'completed' = 'active';
	let sortBy: 'scheduled' | 'priority' = 'scheduled';

	let openDatePickerTaskId: number | null = null;
	let openPriorityDropdownTaskId: number | null = null;

// Fermer le dropdown de priorité quand on clique dehors
onMount(() => {
	document.addEventListener('click', handleClickOutside);
});

onDestroy(() => {
	document.removeEventListener('click', handleClickOutside);
});

	async function handleDateChange(taskId: number, newDate: string) {
		try {
			await taskStore.updateTask(taskId, {
				scheduledDate: newDate || undefined
			});
			openDatePickerTaskId = null; // Fermer automatiquement après sélection
		} catch (error) {
			console.error('Error updating task date:', error);
		}
	}

	function togglePriorityDropdown(taskId: number) {
		openPriorityDropdownTaskId = openPriorityDropdownTaskId === taskId ? null : taskId;
	}

	async function handlePriorityChange(taskId: number, newPriority: 'low' | 'medium' | 'high') {
		try {
			await taskStore.updateTask(taskId, { priority: newPriority });
			openPriorityDropdownTaskId = null; // Fermer le dropdown après sélection
		} catch (error) {
			console.error('Error updating task priority:', error);
		}
	}

	function toggleDatePicker(taskId: number) {
		openDatePickerTaskId = openDatePickerTaskId === taskId ? null : taskId;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.priority-dropdown') && !target.closest('.date-picker')) {
			openPriorityDropdownTaskId = null;
		}
	}

	$: filteredTasks = $taskStore.tasks ? $taskStore.tasks.filter(task => {
		if (filter === 'active') return !task.completed;
		if (filter === 'completed') return task.completed;
		return true;
	}).sort((a, b) => {
		// Tri secondaire selon le critère choisi
		if (sortBy === 'priority') {
			const priorityOrder = { high: 0, medium: 1, low: 2 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		}
		if (sortBy === 'scheduled') {
			if (!a.scheduledDate && !b.scheduledDate) return b.createdAt - a.createdAt;
			if (!a.scheduledDate) return 1;
			if (!b.scheduledDate) return -1;
			return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
		}
		return b.createdAt - a.createdAt;
	}) : [];

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
			<option value="scheduled">Par Date</option>
			<option value="priority">Par Priorité</option>
		</select>
	</div>

	<!-- Task List -->
	<div class="space-y-3">
		<!-- Nouvelle tâche card -->
		<div class="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer group"
			 role="button"
			 tabindex="0"
			 on:click={() => onEditTask({
				 	id: undefined,
				 	title: '',
				 	description: '',
				 	completed: false,
				 	priority: 'medium',
				 	scheduledDate: undefined,
				 	scheduledStartTime: undefined,
				 	scheduledEndTime: undefined,
				 	estimatedMinutes: undefined,
				 	tags: [],
				 	createdAt: Date.now(),
				 	updatedAt: Date.now()
				 } as Task)}
			 on:keydown={(e) => e.key === 'Enter' && onEditTask({
				 	id: undefined,
				 	title: '',
				 	description: '',
				 	completed: false,
				 	priority: 'medium',
				 	scheduledDate: undefined,
				 	scheduledStartTime: undefined,
				 	scheduledEndTime: undefined,
				 	estimatedMinutes: undefined,
				 	tags: [],
				 	createdAt: Date.now(),
				 	updatedAt: Date.now()
				 } as Task)}>
			<div class="flex items-center gap-4">
				<!-- Plus icon -->
				<div class="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
					<Plus class="w-3 h-3 text-zinc-400" />
				</div>

				<!-- Content -->
				<div class="flex-1">
					<h3 class="text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors">
						Nouvelle tâche
					</h3>
					<p class="text-sm text-zinc-500 mt-1">
						Cliquez pour ajouter une tâche
					</p>
				</div>

				<!-- Action hint -->
				<div class="text-zinc-500 group-hover:text-zinc-400 transition-colors">
					<Plus class="w-4 h-4" />
				</div>
			</div>
		</div>

		{#if filteredTasks.length === 0}
			<div class="text-center py-12 text-zinc-500">
				Aucune tâche {filter === 'active' ? 'active' : 'complétée'}
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
										<!-- Priority Selector -->
										<div class="relative priority-dropdown">
											<button
												on:click={() => togglePriorityDropdown(task.id!)}
												class="px-2 py-1 rounded border {getPriorityBg(task.priority)} hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
												title="Cliquer pour changer la priorité"
											>
												<span class={getPriorityColor(task.priority)}>
													{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
												</span>
											</button>

											{#if openPriorityDropdownTaskId === task.id}
												<div class="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl min-w-[120px]">
													<button
														on:click={() => handlePriorityChange(task.id!, 'low')}
														class="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors first:rounded-t-lg {task.priority === 'low' ? 'bg-zinc-800 text-green-400' : 'text-zinc-300'}"
													>
														Basse
													</button>
													<button
														on:click={() => handlePriorityChange(task.id!, 'medium')}
														class="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors {task.priority === 'medium' ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-300'}"
													>
														Moyenne
													</button>
													<button
														on:click={() => handlePriorityChange(task.id!, 'high')}
														class="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors last:rounded-b-lg {task.priority === 'high' ? 'bg-zinc-800 text-red-400' : 'text-zinc-300'}"
													>
														Haute
													</button>
												</div>
											{/if}
										</div>

										<!-- Scheduled Date or Date Picker Button -->
										{#if task.scheduledDate}
											<div class="relative">
												<button
													on:click={() => toggleDatePicker(task.id!)}
													class="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-200 flex items-center gap-1"
													title="Cliquer pour modifier la date"
												>
													<Calendar class="w-3.5 h-3.5" />
													{new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
												</button>
												<InlineDatePicker
													currentDate={task.scheduledDate}
													isOpen={openDatePickerTaskId === task.id}
													on:dateChange={(event) => handleDateChange(task.id!, event.detail)}
													on:close={() => toggleDatePicker(task.id!)}
												/>
											</div>
										{:else}
											<div class="relative">
												<button
													on:click={() => toggleDatePicker(task.id!)}
													class="px-3 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:border-zinc-500 transition-all duration-200 flex items-center gap-1"
													title="Définir une date"
												>
													<Calendar class="w-3.5 h-3.5" />
													Définir une date
												</button>
												<InlineDatePicker
													currentDate=""
													isOpen={openDatePickerTaskId === task.id}
													on:dateChange={(event) => handleDateChange(task.id!, event.detail)}
													on:close={() => toggleDatePicker(task.id!)}
												/>
											</div>
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
