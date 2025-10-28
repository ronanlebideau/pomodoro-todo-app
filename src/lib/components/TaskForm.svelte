<script lang="ts">
	import { taskStore } from '../stores/taskStore';
	import X from 'lucide-svelte/icons/x.svelte';
	import type { Task } from '../db';

	export let task: Task | null = null;
	export let onClose: () => void;

	let title = task?.title || '';
	let description = task?.description || '';
	let scheduledDate = task?.scheduledDate || '';
	let scheduledStartTime = task?.scheduledStartTime || '';
	let scheduledEndTime = task?.scheduledEndTime || '';
	let estimatedMinutes = task?.estimatedMinutes || '';
	let priority: 'low' | 'medium' | 'high' = task?.priority || 'medium';
	let tags = task?.tags.join(', ') || '';

	async function handleSubmit() {
		if (!title.trim()) return;

		const taskData = {
			title: title.trim(),
			description: description.trim(),
			scheduledDate: scheduledDate || undefined,
			scheduledStartTime: scheduledStartTime || undefined,
			scheduledEndTime: scheduledEndTime || undefined,
			estimatedMinutes: estimatedMinutes ? parseInt(String(estimatedMinutes)) : undefined,
			priority,
			tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
			completed: task?.completed || false
		};

		if (task?.id) {
			await taskStore.updateTask(task.id, taskData);
		} else {
			await taskStore.addTask(taskData);
		}

		onClose();
	}
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
	<div class="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		<div class="flex items-center justify-between p-6 border-b border-zinc-800">
			<h2 class="text-xl font-bold text-white">
				{task ? 'Modifier la tâche' : 'Nouvelle tâche'}
			</h2>
			<button
				on:click={onClose}
				class="text-zinc-400 hover:text-white transition-colors"
			>
				<X class="w-6 h-6" />
			</button>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
			<!-- Title -->
			<div>
				<label for="title" class="block text-sm font-medium text-zinc-300 mb-2">
					Titre *
				</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					required
					class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Ex: Préparer la présentation"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="block text-sm font-medium text-zinc-300 mb-2">
					Description
				</label>
				<textarea
					id="description"
					bind:value={description}
					rows="3"
					class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Détails de la tâche..."
				></textarea>
			</div>

			<!-- Priority -->
			<div>
				<fieldset>
					<legend class="block text-sm font-medium text-zinc-300 mb-2">
						Priorité
					</legend>
					<div class="flex gap-3">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								id="priority-low"
								type="radio"
								bind:group={priority}
								value="low"
								class="text-green-500 focus:ring-green-500"
							/>
							<span class="text-sm text-zinc-300">Basse</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								id="priority-medium"
								type="radio"
								bind:group={priority}
								value="medium"
								class="text-yellow-500 focus:ring-yellow-500"
							/>
							<span class="text-sm text-zinc-300">Moyenne</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								id="priority-high"
								type="radio"
								bind:group={priority}
								value="high"
								class="text-red-500 focus:ring-red-500"
							/>
							<span class="text-sm text-zinc-300">Haute</span>
						</label>
					</div>
				</fieldset>
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

			<!-- Tags -->
			<div>
				<label for="tags" class="block text-sm font-medium text-zinc-300 mb-2">
					Tags (séparés par des virgules)
				</label>
				<input
					id="tags"
					type="text"
					bind:value={tags}
					class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Ex: travail, urgent, projet"
				/>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-4">
				<button
					type="submit"
					class="flex-1 px-6 py-3 bg-zinc-700 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
				>
					{task ? 'Mettre à jour' : 'Créer'}
				</button>
				<button
					type="button"
					on:click={onClose}
					class="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
				>
					Annuler
				</button>
			</div>
		</form>
	</div>
</div>
