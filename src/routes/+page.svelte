<script lang="ts">
	import { onMount } from 'svelte';
	import { taskStore } from '$lib/stores/taskStore';
	import PomodoroTimer from '$lib/components/PomodoroTimer.svelte';
	import TaskForm from '$lib/components/TaskForm.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import { goalsStore } from '$lib/stores/goalsStore';
	import DailyGoalsDisplay from '$lib/components/DailyGoalsDisplay.svelte';
	import GoalsModal from '$lib/components/GoalsModal.svelte';
	import DayTimeline from '$lib/components/DayTimeline.svelte';
	import { Calendar, BarChart3, CheckSquare } from 'lucide-svelte';
	import type { Task } from '$lib/db';
	import ClientOnly from '$lib/ClientOnly.svelte';

	let showTaskForm = false;
	let editingTask: Task | null = null;
	let activeTab: 'tasks' | 'planning' | 'stats' = 'tasks';
	let selectedDate: string;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Initialize date only after mount to avoid SSR issues
	onMount(() => {
		selectedDate = new Date().toISOString().split('T')[0];
	});

	// Dispatch date change event when selectedDate changes
	$: if (selectedDate) {
		dispatch('dateChange', selectedDate);
	}

	// Load stores only on client side to avoid SSR issues
	onMount(async () => {
		await Promise.all([
			taskStore.loadTasks(),
			goalsStore.loadGoals()
		]);
	});

	function handleCreateTask(date?: string, time?: string) {
		// Créer une nouvelle tâche avec les valeurs par défaut et les paramètres fournis
		editingTask = {
			id: undefined,
			title: '',
			description: '',
			completed: false,
			priority: 'medium',
			scheduledDate: date || selectedDate,
			scheduledStartTime: time,
			scheduledEndTime: undefined,
			estimatedMinutes: undefined,
			tags: [],
			createdAt: Date.now(),
			updatedAt: Date.now()
		} as Task;
		showTaskForm = true;
	}

	function handleEditTask(task: Task) {
		editingTask = task;
		showTaskForm = true;
	}

	function handleCloseForm() {
		showTaskForm = false;
		editingTask = null;
		// Recharger les tâches après fermeture du formulaire
		taskStore.loadTasks();
	}
</script>

<svelte:head>
	<title>Rorodoro Todo</title>
</svelte:head>

<div class="h-dvh overflow-hidden p-4 bg-black grid grid-cols-2 gap-4">
				<!-- Left Column: Rorodoro Timer -->
				<div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
					<ClientOnly><PomodoroTimer /></ClientOnly>
				</div>

				<!-- Right Column: Tasks/Timeline/Stats -->
				<div class="flex flex-col gap-4 min-h-0">
					<!-- Daily Goals Display -->
					 <div class="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col p-4 basis-1/3 shrink-0">
					<DailyGoalsDisplay />
					</div>

					<!-- Tabs -->
					 <div class="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col p-4 basis-2/3 min-h-0 overflow-y-auto">
						<div class="flex gap-2 border-b border-zinc-800">
							<!-- Tasks Tab -->
							<button
								on:click={() => activeTab = 'tasks'}
								class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'tasks' ? 'border-blue-600 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
							>
								<CheckSquare class="w-4 h-4" />
								Tâches
							</button>
							<!-- Planning Tab -->
							<button
								on:click={() => activeTab = 'planning'}
								class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'planning' ? 'border-blue-600 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
							>
								<Calendar class="w-4 h-4" />
								Planning
							</button>
							<!-- Stats Tab -->
							<button
								on:click={() => activeTab = 'stats'}
								class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'stats' ? 'border-blue-600 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
							>
								<BarChart3 class="w-4 h-4" />
								Statistiques
							</button>
						</div>

					<!-- Tab Content -->
						<div class="mt-4">
							{#if activeTab === 'tasks'}
								<ClientOnly><TaskList onEditTask={handleEditTask} /></ClientOnly>
							{:else if activeTab === 'planning'}
								<div class="space-y-4">
									<div class="flex items-center gap-4">
										<label for="date-picker" class="text-sm font-medium text-zinc-300">
											Sélectionner une date :
										</label>
										<input
											id="date-picker"
											type="date"
											bind:value={selectedDate}
											class="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
										/>
									</div>
									<DayTimeline {selectedDate} {handleCreateTask} on:dateChange={() => {}} />
								</div>
							{:else if activeTab === 'stats'}
								<StatsPanel {selectedDate} />
							{/if}
						</div>
					</div>
				</div>
</div>

<!-- Task Form Modal -->
{#if showTaskForm}
	<ClientOnly><TaskForm task={editingTask} onClose={handleCloseForm} /></ClientOnly>
{/if}

<!-- Daily Goals Modal -->
<ClientOnly>
  <GoalsModal />
</ClientOnly>
