<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import { taskStore } from '$lib/stores/taskStore';
	import { Download, Clock, CheckCircle, Target, Calendar, BarChart3, TrendingUp, Timer } from 'lucide-svelte';

	export let selectedDate: string = '';

	let totalTasks = 0;
	let completedTasks = 0;
	let totalMinutes = 0;
	let totalSessions = 0;
	let taskStats: { taskId: number; title: string; minutes: number }[] = [];

	// Statistiques de la journée
	let dayTasks = 0;
	let dayCompletedTasks = 0;
	let dayMinutes = 0;
	let daySessions = 0;

	// Statistiques de la semaine
	let weekTasks = 0;
	let weekCompletedTasks = 0;
	let weekMinutes = 0;
	let weekSessions = 0;

	let activeTab: 'day' | 'week' | 'global' = 'day';

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		const tasks = await db.getTasks();
		const timeLogs = await db.getTimeLogs();
		const sessions = await db.getPomodoroSessions();

		// Calculer les statistiques globales
		totalTasks = tasks.length;
		completedTasks = tasks.filter(t => t.completed).length;
		totalMinutes = timeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
		totalSessions = sessions.filter(s => s.completed && s.type === 'focus').length;

		// Calculer les statistiques de la journée
		const today = new Date().toISOString().split('T')[0];
		const todayTasks = tasks.filter(t => t.scheduledDate === today);
		dayTasks = todayTasks.length;
		dayCompletedTasks = todayTasks.filter(t => t.completed).length;

		const todayTimeLogs = timeLogs.filter(log => {
			const logDate = new Date(log.startTime).toISOString().split('T')[0];
			return logDate === today;
		});
		dayMinutes = todayTimeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
		daySessions = sessions.filter(s => {
			const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
			return sessionDate === today && s.completed && s.type === 'focus';
		}).length;

		// Calculer les statistiques de la semaine
		const currentDate = new Date(selectedDate || today);
		const weekStart = new Date(currentDate);
		weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lundi
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekStart.getDate() + 4); // Vendredi

		const weekTasksList = tasks.filter(t => {
			if (!t.scheduledDate) return false;
			const taskDate = new Date(t.scheduledDate);
			return taskDate >= weekStart && taskDate <= weekEnd;
		});
		weekTasks = weekTasksList.length;
		weekCompletedTasks = weekTasksList.filter(t => t.completed).length;

		const weekTimeLogs = timeLogs.filter(log => {
			const logDate = new Date(log.startTime);
			return logDate >= weekStart && logDate <= weekEnd;
		});
		weekMinutes = weekTimeLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
		weekSessions = sessions.filter(s => {
			const sessionDate = new Date(s.startTime);
			return sessionDate >= weekStart && sessionDate <= weekEnd && s.completed && s.type === 'focus';
		}).length;

		// Calculate time per task for the selected period
		const taskTimeMap = new Map<number, number>();
		for (const log of weekTimeLogs) {
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
	<!-- Tabs -->
	<div class="flex gap-2 border-b border-zinc-800">
		<button
			on:click={() => activeTab = 'day'}
			class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'day' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
		>
			<Calendar class="w-4 h-4" />
			Jour
		</button>
		<button
			on:click={() => activeTab = 'week'}
			class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'week' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
		>
			<BarChart3 class="w-4 h-4" />
			Semaine
		</button>
		<button
			on:click={() => activeTab = 'global'}
			class="flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 {activeTab === 'global' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}"
		>
			<TrendingUp class="w-4 h-4" />
			Global
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'day'}
		<!-- Daily Statistics -->
		<div class="space-y-4">
			<h2 class="text-xl font-bold text-white">
				<Calendar class="w-5 h-5 mr-2" />
				Statistiques du jour ({new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })})
			</h2>

			<!-- Summary Cards - Day -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-blue-500/10 rounded-lg">
							<Target class="w-6 h-6 text-blue-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{dayTasks}</div>
							<div class="text-sm text-zinc-400">Tâches</div>
						</div>
					</div>
				</div>

				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-green-500/10 rounded-lg">
							<CheckCircle class="w-6 h-6 text-green-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{dayCompletedTasks}</div>
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
							<div class="text-2xl font-bold text-white">{formatDuration(dayMinutes)}</div>
							<div class="text-sm text-zinc-400">Temps travaillé</div>
						</div>
					</div>
				</div>

				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-red-500/10 rounded-lg">
							<Timer class="w-6 h-6 text-red-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{daySessions}</div>
							<div class="text-sm text-zinc-400">Sessions</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Completion Rate - Day -->
			{#if dayTasks > 0}
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Taux de complétion du jour</h3>
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-white font-semibold">
								{Math.round((dayCompletedTasks / dayTasks) * 100)}%
							</span>
						</div>
						<div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
							<div
								class="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
								style={`width: ${Math.round((dayCompletedTasks / dayTasks) * 100)}%`}
							></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

	{:else if activeTab === 'week'}
		<!-- Weekly Statistics -->
		<div class="space-y-4">
			<h2 class="text-xl font-bold text-white">
				<BarChart3 class="w-5 h-5 mr-2" />
				Statistiques de la semaine
			</h2>

			<!-- Summary Cards - Week -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-blue-500/10 rounded-lg">
							<Target class="w-6 h-6 text-blue-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{weekTasks}</div>
							<div class="text-sm text-zinc-400">Tâches</div>
						</div>
					</div>
				</div>

				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-green-500/10 rounded-lg">
							<CheckCircle class="w-6 h-6 text-green-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{weekCompletedTasks}</div>
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
							<div class="text-2xl font-bold text-white">{formatDuration(weekMinutes)}</div>
							<div class="text-sm text-zinc-400">Temps travaillé</div>
						</div>
					</div>
				</div>

				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<div class="flex items-center gap-3">
						<div class="p-3 bg-red-500/10 rounded-lg">
							<Timer class="w-6 h-6 text-red-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{weekSessions}</div>
							<div class="text-sm text-zinc-400">Sessions</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Top Tasks by Time -->
			<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-white">Top 5 tâches par temps (semaine)</h3>
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

			<!-- Completion Rate - Week -->
			{#if weekTasks > 0}
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Taux de complétion de la semaine</h3>
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-white font-semibold">
								{Math.round((weekCompletedTasks / weekTasks) * 100)}%
							</span>
						</div>
						<div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
							<div
								class="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
								style={`width: ${Math.round((weekCompletedTasks / weekTasks) * 100)}%`}
							></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

	{:else if activeTab === 'global'}
		<!-- Global Statistics -->
		<div class="space-y-4">
			<h2 class="text-xl font-bold text-white">
				<TrendingUp class="w-5 h-5 mr-2" />
				Statistiques globales
			</h2>

			<!-- Summary Cards - Global -->
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
							<Timer class="w-6 h-6 text-red-500" />
						</div>
						<div>
							<div class="text-2xl font-bold text-white">{totalSessions}</div>
							<div class="text-sm text-zinc-400">Sessions Pomodoro</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Top Tasks by Time - Global -->
			<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-white">Top 5 tâches par temps (global)</h3>
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

			<!-- Completion Rate - Global -->
			{#if totalTasks > 0}
				<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Taux de complétion global</h3>
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
	{/if}
</div>
