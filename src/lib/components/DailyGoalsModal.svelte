<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { dailyGoalsStore } from '$lib/stores/dailyGoalsStore';

	const dispatch = createEventDispatcher();

	let currentGoals = $dailyGoalsStore.currentGoals;
	let editingGoalNumber = $dailyGoalsStore.editingGoalNumber;
	let goal1 = '';
	let goal2 = '';
	let goal3 = '';
	let editingGoalText = '';

	// Subscribe to store changes
	dailyGoalsStore.subscribe(state => {
		currentGoals = state.currentGoals;
		editingGoalNumber = state.editingGoalNumber;

		// Pre-fill form with existing goals
		if (currentGoals) {
			goal1 = currentGoals.goal1 || '';
			goal2 = currentGoals.goal2 || '';
			goal3 = currentGoals.goal3 || '';
		} else {
			goal1 = '';
			goal2 = '';
			goal3 = '';
		}

		// Pre-fill editing goal text
		if (editingGoalNumber && currentGoals) {
			switch (editingGoalNumber) {
				case 1: editingGoalText = goal1; break;
				case 2: editingGoalText = goal2; break;
				case 3: editingGoalText = goal3; break;
			}
		} else {
			editingGoalText = '';
		}
	});

	async function handleSubmit() {
		if (editingGoalNumber) {
			// Edit specific goal
			if (editingGoalText.trim()) {
				await dailyGoalsStore.updateSpecificGoal(editingGoalNumber, editingGoalText.trim());
				await dailyGoalsStore.hideGoalsModal();
				dispatch('close');
			}
		} else {
			// Create all goals
			if (goal1.trim() && goal2.trim() && goal3.trim()) {
				await dailyGoalsStore.createOrUpdateGoals(goal1.trim(), goal2.trim(), goal3.trim());
				await dailyGoalsStore.setLastVisitDate();
				await dailyGoalsStore.hideGoalsModal();
				dispatch('close');
			}
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function isEditingSpecificGoal(): boolean {
		return editingGoalNumber !== undefined;
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
	<div class="glass-card p-8 w-full max-w-lg animate-slide-in">
		<div class="text-center mb-6">
			<h2 class="text-2xl font-semibold text-white mb-2">
				{#if isEditingSpecificGoal()}
					Objectif {editingGoalNumber}
				{:else}
					Objectifs du Jour
				{/if}
			</h2>
			<p class="text-neutral-400">
				{#if isEditingSpecificGoal()}
					Modifiez votre objectif {editingGoalNumber}
				{:else}
					Définissez vos 3 objectifs principaux pour aujourd'hui
				{/if}
			</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			{#if isEditingSpecificGoal()}
				<!-- Edit specific goal -->
				<div class="space-y-2">
					<label for="goal{editingGoalNumber}" class="block text-sm font-medium text-white/80">
						Objectif {editingGoalNumber}
					</label>
					<input
						id="goal{editingGoalNumber}"
						type="text"
						bind:value={editingGoalText}
						placeholder="Ex: Terminer le rapport mensuel"
						class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						required
					/>
				</div>
			{:else}
				<!-- Create all goals -->
				<div class="space-y-2">
					<label for="goal1" class="block text-sm font-medium text-white/80">
						Objectif 1
					</label>
					<input
						id="goal1"
						type="text"
						bind:value={goal1}
						placeholder="Ex: Terminer le rapport mensuel"
						class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						required
					/>
				</div>

				<div class="space-y-2">
					<label for="goal2" class="block text-sm font-medium text-white/80">
						Objectif 2
					</label>
					<input
						id="goal2"
						type="text"
						bind:value={goal2}
						placeholder="Ex: Répondre aux emails en attente"
						class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						required
					/>
				</div>

				<div class="space-y-2">
					<label for="goal3" class="block text-sm font-medium text-white/80">
						Objectif 3
					</label>
					<input
						id="goal3"
						type="text"
						bind:value={goal3}
						placeholder="Ex: Planifier la réunion de demain"
						class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						required
					/>
				</div>
			{/if}

			<div class="flex gap-3 pt-4">
				<button
					type="button"
					on:click={handleClose}
					class="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
				>
					Annuler
				</button>
				<button
					type="submit"
					class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
				>
					{#if isEditingSpecificGoal()}
						Modifier
					{:else}
						Enregistrer
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
