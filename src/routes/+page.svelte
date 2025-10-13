<script lang="ts">
	import { onMount } from 'svelte';
	import { taskStore } from '$lib/stores/taskStore';
	import PomodoroTimer from '$lib/components/PomodoroTimer.svelte';
	import TaskForm from '$lib/components/TaskForm.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import { dailyGoalsStore } from '$lib/stores/dailyGoalsStore';
	import DailyGoalsDisplay from '$lib/components/DailyGoalsDisplay.svelte';
	import DailyGoalsModal from '$lib/components/DailyGoalsModal.svelte';
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
		await taskStore.loadTasks();
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
	<title>Pomodoro Todo App</title>
</svelte:head>

<div class="min-h-screen bg-black text-white">
	<!-- Header -->
	<header class="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur sticky top-0 z-40">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-white">🍅 Pomodoro Todo</h1>
					<p class="text-sm text-zinc-400">Planifiez, focalisez, accomplissez</p>
				</div>
			</div>
		</div>
	</header>

	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Pomodoro Timer -->
			<div class="lg:col-span-1">
				<ClientOnly><PomodoroTimer /></ClientOnly>
			</div>

			<!-- Right Column: Tasks/Timeline/Stats -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Daily Goals Display -->
				<DailyGoalsDisplay />

				<!-- Tabs -->
				<div class="flex gap-2 border-b border-zinc-800">
					<button
						on:click={() => activeTab = 'tasks'}
						class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'tasks' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
					>
						<CheckSquare class="w-4 h-4" />
						Tâches
					</button>
					<button
						on:click={() => activeTab = 'planning'}
						class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'planning' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
					>
						<Calendar class="w-4 h-4" />
						Planning
					</button>
					<button
						on:click={() => activeTab = 'stats'}
						class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'stats' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
					>
						<BarChart3 class="w-4 h-4" />
						Statistiques
					</button>
				</div>

				<!-- Tab Content -->
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
{#if $dailyGoalsStore.showModal}
	<ClientOnly><DailyGoalsModal on:close={() => {
		dailyGoalsStore.setLastVisitDate();
		dailyGoalsStore.hideGoalsModal();
	}} /></ClientOnly>
{/if}
