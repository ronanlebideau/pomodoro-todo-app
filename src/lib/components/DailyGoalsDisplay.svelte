<script lang="ts">
	import { dailyGoalsStore } from '$lib/stores/dailyGoalsStore';
	import { CheckCircle2, Circle, Target, Edit3, Plus } from 'lucide-svelte';

	let currentGoals = $dailyGoalsStore.currentGoals;

	// Subscribe to store changes
	dailyGoalsStore.subscribe(state => {
		currentGoals = state.currentGoals;
	});

	async function toggleGoal(goalNumber: 1 | 2 | 3) {
		await dailyGoalsStore.toggleGoalCompletion(goalNumber);
	}

	function editGoals() {
		dailyGoalsStore.showGoalsModal();
	}

	function editGoal(goalNumber: 1 | 2 | 3) {
		dailyGoalsStore.showGoalsModalForGoal(goalNumber);
	}

	function getGoalStatus(goalNumber: 1 | 2 | 3): boolean {
		if (!currentGoals) return false;
		return currentGoals[`completed${goalNumber}`] as boolean;
	}

	function getGoalText(goalNumber: 1 | 2 | 3): string {
		if (!currentGoals) return '';
		return currentGoals[`goal${goalNumber}`] as string;
	}

	function hasGoal(goalNumber: 1 | 2 | 3): boolean {
		return getGoalText(goalNumber).trim() !== '';
	}
</script>

<!-- Always show the goals section -->
<div class="bg-neutral-800 border border-neutral-700 rounded-lg p-4 mb-4">
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<Target class="w-5 h-5 text-blue-400" />
			<h3 class="font-medium text-white">Objectifs du Jour</h3>
		</div>
		<button
			on:click={editGoals}
			class="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-md transition-colors"
		>
			<Edit3 class="w-3 h-3" />
			Modifier
		</button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<!-- Goal 1 -->
		<div class="bg-neutral-900/50 border border-neutral-700 rounded-lg p-3">
			<button
				on:click={() => hasGoal(1) ? toggleGoal(1) : editGoal(1)}
				class="flex items-start gap-3 w-full text-left group hover:bg-neutral-800/50 rounded-lg p-2 transition-colors"
			>
				{#if hasGoal(1)}
					{#if getGoalStatus(1)}
						<CheckCircle2 class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
					{:else}
						<Circle class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-neutral-400 transition-colors" />
					{/if}
					<span class="text-sm text-white/90 leading-relaxed {getGoalStatus(1) ? 'line-through opacity-60' : ''}">
						{getGoalText(1)}
					</span>
				{:else}
					<Plus class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
					<span class="text-sm text-neutral-400 leading-relaxed">
						Cliquer pour ajouter un objectif
					</span>
				{/if}
			</button>
		</div>

		<!-- Goal 2 -->
		<div class="bg-neutral-900/50 border border-neutral-700 rounded-lg p-3">
			<button
				on:click={() => hasGoal(2) ? toggleGoal(2) : editGoal(2)}
				class="flex items-start gap-3 w-full text-left group hover:bg-neutral-800/50 rounded-lg p-2 transition-colors"
			>
				{#if hasGoal(2)}
					{#if getGoalStatus(2)}
						<CheckCircle2 class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
					{:else}
						<Circle class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-neutral-400 transition-colors" />
					{/if}
					<span class="text-sm text-white/90 leading-relaxed {getGoalStatus(2) ? 'line-through opacity-60' : ''}">
						{getGoalText(2)}
					</span>
				{:else}
					<Plus class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
					<span class="text-sm text-neutral-400 leading-relaxed">
						Cliquer pour ajouter un objectif
					</span>
				{/if}
			</button>
		</div>

		<!-- Goal 3 -->
		<div class="bg-neutral-900/50 border border-neutral-700 rounded-lg p-3">
			<button
				on:click={() => hasGoal(3) ? toggleGoal(3) : editGoal(3)}
				class="flex items-start gap-3 w-full text-left group hover:bg-neutral-800/50 rounded-lg p-2 transition-colors"
			>
				{#if hasGoal(3)}
					{#if getGoalStatus(3)}
						<CheckCircle2 class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
					{:else}
						<Circle class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-neutral-400 transition-colors" />
					{/if}
					<span class="text-sm text-white/90 leading-relaxed {getGoalStatus(3) ? 'line-through opacity-60' : ''}">
						{getGoalText(3)}
					</span>
				{:else}
					<Plus class="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
					<span class="text-sm text-neutral-400 leading-relaxed">
						Cliquer pour ajouter un objectif
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Progress indicator - only show if there are goals -->
	{#if currentGoals && (currentGoals.goal1 || currentGoals.goal2 || currentGoals.goal3)}
		<div class="mt-3 flex items-center justify-between text-xs text-neutral-400">
			<span>
				{Math.round(((currentGoals.completed1 ? 1 : 0) + (currentGoals.completed2 ? 1 : 0) + (currentGoals.completed3 ? 1 : 0)) / 3 * 100)}% complété
			</span>
			<span>
				{(currentGoals.completed1 ? 1 : 0) + (currentGoals.completed2 ? 1 : 0) + (currentGoals.completed3 ? 1 : 0)}/3 objectifs atteints
			</span>
		</div>
	{/if}
</div>
