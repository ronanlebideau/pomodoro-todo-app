<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import { taskStore } from '$lib/stores/taskStore';
	import { Download, Clock, CheckCircle, Target } from 'lucide-svelte';

	let totalTasks = 0;
	let completedTasks = 0;
	let totalMinutes = 0;
	let totalSessions = 0;
	let taskStats: { taskId: number; title: string; minutes: number }[] = [];

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		const tasks = await db.getTasks();
		totalTasks = tasks.length;
		completedTasks = tasks.filter(t => t.completed).length;

		const timeLogs = await db.getTimeLogs();
		totalMinutes = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

		const sessions = await db.getPomodoroSessions();
		totalSessions = sessions.filter(s => s.completed && s.type === 'focus').length;

		// Calculate time per task
		const taskTimeMap = new Map<number, number>();
		for (const log of timeLogs) {
			const current = taskTimeMap.get(log.taskId) || 0;
			taskTimeMap.set(log.taskId, current + (log.durationMinutes || 0));
		}

		taskStats = await Promise.all(
			Array.from(taskTimeMap.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(async ([taskId, minutes]) => {
					const task = await db.getTask(taskId);
					return {
						taskId,
						title: task?.title || 'Tâche supprimée',
						minutes
					};
				})
		);
	}

	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}min`;
		}
		return `${mins}min`;
	}

	async function handleExport() {
		await taskStore.exportToCSV();
	}
</script>

<div class="space-y-6">
	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-blue-500/10 rounded-lg">
					<Target class="w-6 h-6 text-blue-500" />
				</div>
				<div>
					<div class="text-2xl font-bold text-white">{totalTasks}</div>
					<div class="text-sm text-zinc-400">Tâches totales</div>
				</div>
			</div>
		</div>

		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-green-500/10 rounded-lg">
					<CheckCircle class="w-6 h-6 text-green-500" />
				</div>
				<div>
					<div class="text-2xl font-bold text-white">{completedTasks}</div>
					<div class="text-sm text-zinc-400">Complétées</div>
				</div>
			</div>
		</div>

		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-purple-500/10 rounded-lg">
					<Clock class="w-6 h-6 text-purple-500" />
				</div>
				<div>
					<div class="text-2xl font-bold text-white">{formatDuration(totalMinutes)}</div>
					<div class="text-sm text-zinc-400">Temps total</div>
				</div>
			</div>
		</div>

		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-red-500/10 rounded-lg">
					<div class="w-6 h-6 text-red-500 font-bold flex items-center justify-center">🍅</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-white">{totalSessions}</div>
					<div class="text-sm text-zinc-400">Sessions Pomodoro</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Top Tasks by Time -->
	<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-white">Top 5 tâches par temps</h3>
			<button
				on:click={handleExport}
				class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
			>
				<Download class="w-4 h-4" />
				Exporter CSV
			</button>
		</div>

		{#if taskStats.length === 0}
			<div class="text-center py-8 text-zinc-500">
				Aucune donnée de temps disponible
			</div>
		{:else}
			<div class="space-y-3">
				{#each taskStats as stat}
					<div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white truncate">
								{stat.title}
							</div>
						</div>
						<div class="text-sm font-semibold text-purple-400 ml-4">
							{formatDuration(stat.minutes)}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Completion Rate -->
	{#if totalTasks > 0}
		<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
			<h3 class="text-lg font-semibold text-white mb-4">Taux de complétion</h3>
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-white font-semibold">
						{Math.round((completedTasks / totalTasks) * 100)}%
					</span>
				</div>
				<div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
					<div
						class="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
						style={`width: ${Math.round((completedTasks / totalTasks) * 100)}%`}
					></div>
				</div>
			</div>
		</div>
	{/if}
</div>
