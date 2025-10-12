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
	import { Plus, BarChart3 } from 'lucide-svelte';
	import type { Task } from '$lib/db';

	let showTaskForm = false;
	let editingTask: Task | null = null;
	let selectedTaskId: number | null = null;
	let activeTab: 'tasks' | 'stats' = 'tasks';

	onMount(async () => {
		await taskStore.loadTasks();
	});

	function handleNewTask() {
		editingTask = null;
		showTaskForm = true;
	}

	function handleEditTask(task: Task) {
		editingTask = task;
		showTaskForm = true;
	}

	function handleCloseForm() {
		showTaskForm = false;
		editingTask = null;
	}

	function handleSelectTask(taskId: number) {
		selectedTaskId = taskId;
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
				<button
					on:click={handleNewTask}
					class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus class="w-5 h-5" />
					Nouvelle tâche
				</button>
			</div>
		</div>
	</header>

	<div class="container mx-auto px-4 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Pomodoro Timer -->
			<div class="lg:col-span-1">
				<PomodoroTimer taskId={selectedTaskId} />
			</div>

			<!-- Right Column: Tasks/Timeline/Stats -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Daily Goals Display -->
				<DailyGoalsDisplay />

				<!-- Tabs -->
				<div class="flex gap-2 border-b border-zinc-800">
					<button
						on:click={() => activeTab = 'tasks'}
						class="px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'tasks' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
					>
						Tâches
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
					<TaskList onEditTask={handleEditTask} onSelectTask={handleSelectTask} />
				{:else if activeTab === 'stats'}
					<StatsPanel />
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Task Form Modal -->
{#if showTaskForm}
	<TaskForm task={editingTask} onClose={handleCloseForm} />
{/if}

<!-- Daily Goals Modal -->
{#if $dailyGoalsStore.showModal}
	<DailyGoalsModal on:close={() => {
		dailyGoalsStore.setLastVisitDate();
		dailyGoalsStore.hideGoalsModal();
	}} />
{/if}
