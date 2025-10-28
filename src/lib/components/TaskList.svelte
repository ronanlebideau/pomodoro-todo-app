<script lang="ts">
	import { onMount } from 'svelte';
	import { taskStore } from '$lib/stores/taskStore';
	import Brain from 'lucide-svelte/icons/brain.svelte';
	import Check from 'lucide-svelte/icons/check.svelte';
	import Clock from 'lucide-svelte/icons/clock.svelte';
	import Edit from 'lucide-svelte/icons/edit.svelte';
	import Trash2 from 'lucide-svelte/icons/trash-2.svelte';
	import Play from 'lucide-svelte/icons/play.svelte';
	import Square from 'lucide-svelte/icons/square.svelte';
	import Plus from 'lucide-svelte/icons/plus.svelte';
	import type { Task } from '$lib/db';
	import { getFocusSessionsByTask } from '$lib/utils/countFocusSessions';

	export let onEditTask: (task: Task) => void;

	let filter: 'active' | 'completed' = 'active';
	let sortBy: 'scheduled' | 'priority' = 'scheduled';
	let focusSessions: Record<number, number> = {};

	let openPriorityDropdownTaskId: number | null = null;

	// Gestionnaire de clic en dehors du menu de priorité
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		
		// Fermer le menu de priorité si on clique en dehors
		if (!target.closest('.priority-dropdown') && !target.closest('.priority-dropdown-button')) {
			openPriorityDropdownTaskId = null;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		
		// Charger les sessions de focus de manière asynchrone
		getFocusSessionsByTask().then(sessions => {
			focusSessions = sessions;
		});
		
		// Nettoyage lors du démontage du composant
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	$: filteredTasks = $taskStore.tasks ? $taskStore.tasks.filter((task: Task) => {
		if (filter === 'active') return !task.completed;
		if (filter === 'completed') return task.completed;
		return true;
	}).sort((a: Task, b: Task) => {
		if (sortBy === 'priority') {
			const priorityOrder = { high: 0, medium: 1, low: 2 };
			return (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
			       (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
		}
		if (sortBy === 'scheduled') {
			if (!a.scheduledDate && !b.scheduledDate) return b.createdAt - a.createdAt;
			if (!a.scheduledDate) return 1;
			if (!b.scheduledDate) return -1;
			return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
		}
		return b.createdAt - a.createdAt;
	}) : [];

	async function handleDateChange(taskId: number, newDate: string) {
		try {
			await taskStore.updateTask(taskId, {
				scheduledDate: newDate || undefined
			});
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
			openPriorityDropdownTaskId = null;
		} catch (error) {
			console.error('Error updating task priority:', error);
		}
	}

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
			default: return 'text-gray-400';
		}
	}

	function getPriorityLabel(priority: string) {
		switch (priority) {
			case 'high': return 'Haute priorité';
			case 'medium': return 'Priorité moyenne';
			case 'low': return 'Basse priorité';
			default: return 'Priorité non définie';
		}
	}

	function formatFullDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<style>
	/* Style personnalisé pour les infobulles plus réactives */
	[data-tooltip] {
		position: relative;
	}

	[data-tooltip]:hover::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background-color: #1f2937; /* bg-gray-800 */
		color: #f3f4f6; /* text-gray-100 */
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem; /* rounded-md */
		font-size: 0.75rem; /* text-xs */
		white-space: nowrap;
		z-index: 50;
		pointer-events: none;
		top: auto;
		margin-bottom: 5px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		animation: fadeIn 0.1s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-50%) translateY(5px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}
</style>

<div class="space-y-3">
	<!-- Filters and Sort -->
	<div class="flex flex-wrap gap-4 items-center justify-between">
		<div class="flex gap-2">
			<button
				on:click={() => filter = 'active'}
				class="px-3 py-1 text-sm rounded-lg transition-colors {filter === 'active' ? 'bg-accent-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
				data-tooltip="Afficher les tâches actives"
				aria-label="Afficher les tâches actives"
			>
				Actives
			</button>
			<button
				on:click={() => filter = 'completed'}
				class="px-3 py-1 text-sm rounded-lg transition-colors {filter === 'completed' ? 'bg-accent-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
				data-tooltip="Afficher les tâches terminées"
				aria-label="Afficher les tâches terminées"
			>
				Terminées
			</button>
		</div>
		<div class="flex gap-2">
			<select
				bind:value={sortBy}
				class="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
				data-tooltip="Trier les tâches"
				aria-label="Trier les tâches"
			>
				<option value="scheduled" data-tooltip="Trier par date">Par date</option>
				<option value="priority" data-tooltip="Trier par priorité">Par priorité</option>
			</select>
		</div>
	</div>

	<!-- Tasks List -->
	<div class="space-y-3">
		<!-- Nouvelle tâche card -->
		<div 
			class="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer group"
			role="button"
			tabindex="0"
			data-tooltip="Ajouter une nouvelle tâche"
			aria-label="Ajouter une nouvelle tâche"
			on:click={() => onEditTask({
				id: undefined,
				title: '',
				description: '',
				scheduledDate: '',
				scheduledStartTime: '',
				scheduledEndTime: '',
				estimatedMinutes: undefined,
				completed: false,
				tags: [],
				priority: 'medium',
				createdAt: Date.now(),
				updatedAt: Date.now()
			})}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onEditTask({
						id: undefined,
						title: '',
						description: '',
						scheduledDate: '',
						scheduledStartTime: '',
						scheduledEndTime: '',
						estimatedMinutes: undefined,
						completed: false,
						tags: [],
						priority: 'medium',
						createdAt: Date.now(),
						updatedAt: Date.now()
					});
				}
			}}
		>
			<div class="flex items-center gap-3 text-zinc-500 group-hover:text-accent-500 transition-colors">
				<Plus class="w-5 h-5" />
				<span class="font-medium">Ajouter une tâche</span>
			</div>
		</div>
		<!--Scrollable container-->

			{#if $taskStore.loading}
				<div class="flex justify-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" data-tooltip="Chargement en cours" aria-label="Chargement en cours"></div>
				</div>
			{:else if filteredTasks.length === 0}
				<div class="text-center py-8 text-zinc-500">
					<p>Aucune tâche {filter === 'active' ? 'active' : 'terminée'} pour le moment</p>
				</div>
			{:else}
				{#each filteredTasks as task (task.id)}
					<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
						<div class="flex items-start gap-4">
							<!-- Checkbox -->
							<button
								on:click={() => handleToggleComplete(task.id!)}
								class="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors {task.completed ? 'bg-accent-600 border-accent-600' : 'border-zinc-600 hover:border-zinc-500'}"
								data-tooltip={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
								aria-label={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
							>
								{#if task.completed}
									<Check class="w-3 h-3 text-white" />
								{/if}
							</button>

							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<h3 class="text-white font-medium {task.completed ? 'line-through text-zinc-500' : ''}">
											{task.title}
										</h3>
										{#if task.description}
											<p class="text-sm text-zinc-400 mt-1">{task.description}</p>
										{/if}

										<div class="flex flex-wrap gap-2 mt-2">
											<div class="relative date-picker-container">
											<button
												on:click|stopPropagation={() => togglePriorityDropdown(task.id!)}
												class="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors"
												data-tooltip="Modifier la priorité"
												aria-label="Modifier la priorité"
											>
												<div class={`w-2 h-2 rounded-full ${getPriorityColor(task.priority).replace('text-', 'bg-')}`}></div>
												<span class="capitalize">{task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
											</button>

											{#if openPriorityDropdownTaskId === task.id}
												<div class="absolute z-10 mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
													<button
														on:click|stopPropagation={() => handlePriorityChange(task.id!, 'high')}
														class="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"
													>
														<div class="w-2 h-2 rounded-full bg-red-500"></div>
														<span>Haute</span>
														{#if task.priority === 'high'}<Check class="w-3.5 h-3.5 ml-auto" />{/if}
													</button>
													<button
														on:click|stopPropagation={() => handlePriorityChange(task.id!, 'medium')}
														class="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"
													>
														<div class="w-2 h-2 rounded-full bg-yellow-500"></div>
														<span>Moyenne</span>
														{#if task.priority === 'medium'}<Check class="w-3.5 h-3.5 ml-auto" />{/if}
													</button>
													<button
														on:click|stopPropagation={() => handlePriorityChange(task.id!, 'low')}
														class="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2"
													>
														<div class="w-2 h-2 rounded-full bg-green-500"></div>
														<span>Basse</span>
														{#if task.priority === 'low'}<Check class="w-3.5 h-3.5 ml-auto" />{/if}
													</button>
												</div>
											{/if}
										</div>

											{#if task.scheduledDate}
												<div class="flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
													<span>{new Date(task.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
												</div>
											{/if}

											{#if task.tags && task.tags.length > 0}
												{#each task.tags as tag}
													<span 
														class="text-xs bg-accent-500/30 text-accent-500 border-accent-500 border opacity-50 px-2 py-1 rounded"
														data-tooltip="Tag : {tag}"
														aria-label="Tag : {tag}"
													>
														{tag}
													</span>
												{/each}
											{/if}

											
										</div>
									</div>

									<div class="flex gap-2">
										<!-- Affichage du compteur de sessions de focus -->
											{#if focusSessions[task.id!] > 0}
												<div 
													class="flex items-center gap-1 text-xs bg-accent-500/30 text-accent-600 px-2 py-1 rounded"
													data-tooltip="{focusSessions[task.id!]} session{focusSessions[task.id!] > 1 ? 's' : ''} de focus"
													aria-label="{focusSessions[task.id!]} session{focusSessions[task.id!] > 1 ? 's' : ''} de focus"
												>
													<Brain class="w-4 h-4" />
													<span>{focusSessions[task.id!]}</span>
												</div>
											{/if}
										{#if $taskStore.activeTimeLog?.taskId === task.id}
											<button
												on:click={handleStopTracking}
												class="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
												data-tooltip="Arrêter le suivi du temps"
												aria-label="Arrêter le suivi du temps"
											>
												<Square class="w-4 h-4" />
											</button>
										{:else}
											<button
												on:click={() => handleStartTracking(task.id!)}
												class="p-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors"
												data-tooltip="Démarrer le suivi du temps"
												aria-label="Démarrer le suivi du temps pour cette tâche"
											>
												<Play class="w-4 h-4" />
											</button>
										{/if}

										<button
											on:click={(e) => {
												e.stopPropagation();
												onEditTask(task);
											}}
											class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
											data-tooltip="Modifier la tâche"
											aria-label="Modifier la tâche"
										>
											<Edit class="w-4 h-4" />
										</button>

										<button
											on:click={(e) => {
												e.stopPropagation();
												handleDelete(task.id!);
											}}
											class="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
											data-tooltip="Supprimer la tâche"
											aria-label="Supprimer la tâche"
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
