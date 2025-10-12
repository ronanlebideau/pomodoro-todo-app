<script lang="ts">
	import { taskStore } from '$lib/stores/taskStore';
	import { X } from 'lucide-svelte';
	import type { Task } from '$lib/db';

	export let task: Task | null = null;
	export let onClose: () => void;

	let title = task?.title || '';
	let description = task?.description || '';
	let priority: 'low' | 'medium' | 'high' = task?.priority || 'medium';
	let tags = task?.tags.join(', ') || '';
	let scheduledDate = task?.scheduledDate || '';
	let scheduledStartTime = task?.scheduledStartTime || '';
	let scheduledEndTime = task?.scheduledEndTime || '';
	let estimatedMinutes = task?.estimatedMinutes || '';

	let isSubmitting = false;

	$: canSubmit = title.trim() && !isSubmitting;

	async function handleSubmit() {
		if (!canSubmit) return;

		isSubmitting = true;

		try {
			const taskData = {
				title: title.trim(),
				description: description.trim(),
				priority,
				tags: tags.split(',').map(t => t.trim()).filter(Boolean),
				completed: task?.completed || false,
				scheduledDate: scheduledDate || undefined,
				scheduledStartTime: scheduledStartTime || undefined,
				scheduledEndTime: scheduledEndTime || undefined,
				estimatedMinutes: estimatedMinutes ? parseInt(String(estimatedMinutes)) : undefined
			};

			if (task) {
				await taskStore.updateTask(task.id!, taskData);
			} else {
				await taskStore.addTask(taskData);
			}

			onClose();
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Header -->
<div class="flex items-center justify-between mb-6">
	<h2 class="text-xl font-medium text-white">
		{task ? 'Modifier la tâche' : 'Nouvelle tâche'}
	</h2>
	<button
		on:click={onClose}
		class="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
	>
		<X class="w-5 h-5" />
	</button>
</div>

<!-- Form -->
<form on:submit|preventDefault={handleSubmit} class="space-y-4">
	<!-- Title -->
	<div>
		<input
			type="text"
			bind:value={title}
			placeholder="Titre de la tâche"
			class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			required
		/>
	</div>

	<!-- Description -->
	<div>
		<textarea
			bind:value={description}
			placeholder="Description (optionnelle)"
			rows="3"
			class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
		></textarea>
	</div>

	<!-- Priority -->
	<div>
		<select
			bind:value={priority}
			class="w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors {priority === 'low' ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20' : priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20' : 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20'}"
		>
			<option value="low">Priorité basse</option>
			<option value="medium">Priorité moyenne</option>
			<option value="high">Priorité haute</option>
		</select>
	</div>

	<!-- Scheduling Section -->
	<div class="border-t border-neutral-700 pt-4 mt-4">
		<h3 class="text-sm font-medium text-white mb-3">Planification (optionnel)</h3>

		<!-- Date -->
		<div class="mb-3">
			<label for="scheduled-date" class="block text-sm font-medium text-neutral-300 mb-2">
				Date prévue
			</label>
			<input
				id="scheduled-date"
				type="date"
				bind:value={scheduledDate}
				class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>

		<!-- Time Range -->
		<div class="grid grid-cols-2 gap-3 mb-3">
			<div>
				<label for="start-time" class="block text-sm font-medium text-neutral-300 mb-2">
					Heure de début
				</label>
				<input
					id="start-time"
					type="time"
					bind:value={scheduledStartTime}
					class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label for="end-time" class="block text-sm font-medium text-neutral-300 mb-2">
					Heure de fin
				</label>
				<input
					id="end-time"
					type="time"
					bind:value={scheduledEndTime}
					class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>

		<!-- Estimated Duration -->
		<div>
			<label for="estimated-minutes" class="block text-sm font-medium text-neutral-300 mb-2">
				Durée estimée (minutes)
			</label>
			<input
				id="estimated-minutes"
				type="number"
				bind:value={estimatedMinutes}
				placeholder="Ex: 60"
				min="1"
				class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-3 pt-4">
		<button
			type="button"
			on:click={onClose}
			class="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
		>
			Annuler
		</button>
		<button
			type="submit"
			disabled={!canSubmit}
			class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
		>
			{isSubmitting ? 'Sauvegarde...' : (task ? 'Modifier' : 'Créer')}
		</button>
	</div>
</form>
