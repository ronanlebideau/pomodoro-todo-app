<script lang="ts">
  import { goalsStore } from '$lib/stores/goalsStore';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let goal1 = '';
  let goal2 = '';
  let goal3 = '';
  
  const periodLabels = {
    day: 'du jour',
    week: 'de la semaine',
    month: 'du mois',
    year: "de l'année"
  };

  $: showModal = $goalsStore.showModal;
  $: activePeriod = $goalsStore.activePeriod;
  $: editingGoalNumber = $goalsStore.editingGoalNumber;

  $: if (showModal) {
    const goals = $goalsStore.currentGoals[activePeriod];
    if (goals) {
      goal1 = goals.goal1 || '';
      goal2 = goals.goal2 || '';
      goal3 = goals.goal3 || '';
    } else {
      goal1 = goal2 = goal3 = '';
    }
  }

  function handleSubmit() {
    if (!goal1.trim() && !goal2.trim() && !goal3.trim()) {
      goalsStore.hideGoalsModal();
      return;
    }
    
    goalsStore.saveGoals(activePeriod, { 
      goal1: goal1.trim(), 
      goal2: goal2.trim(), 
      goal3: goal3.trim() 
    });
  }

  function handleClose() {
    goalsStore.hideGoalsModal();
  }
</script>

{#if showModal}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    transition:fade
    on:click|self={handleClose}
    on:keydown={(e) => e.key === 'Enter' && handleClose()}
    role="dialog"
    aria-modal="true"
    aria-label="Modifier les objectifs"
    tabindex="0"
  >
    <div class="sr-only" aria-atomic="true" aria-live="polite">
      {editingGoalNumber ? `Modification de l'objectif ${editingGoalNumber}` : 'Modification des objectifs'}
    </div>
    <div
      class="bg-zinc-800 rounded-xl p-6 w-full max-w-md"
      transition:fly={{ y: 20, duration: 200, easing: quintOut }}
    >
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-medium text-white">
            {editingGoalNumber ? `Modifier l'objectif ${editingGoalNumber}` : 'Modifier les objectifs'}
          </h3>
          <p class="text-sm text-gray-400">Période : Objectifs {periodLabels[activePeriod]}</p>
        </div>
        <button
          on:click={handleClose}
          class="text-gray-400 hover:text-white text-2xl"
          aria-label="Fermer"
        >
          &times;
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="goal1" class="block text-sm font-medium text-gray-300 mb-1">Objectif 1</label>
          <input
            id="goal1"
            type="text"
            bind:value={goal1}
            placeholder={`Objectif 1 ${periodLabels[activePeriod]}`}
            class="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>

        <div>
          <label for="goal2" class="block text-sm font-medium text-gray-300 mb-1">Objectif 2</label>
          <input
            id="goal2"
            type="text"
            bind:value={goal2}
            placeholder={`Objectif 2 ${periodLabels[activePeriod]}`}
            class="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white 
                   focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder-gray-500"
          />
        </div>

        <div>
          <label for="goal3" class="block text-sm font-medium text-gray-300 mb-1">Objectif 3</label>
          <input
            id="goal3"
            type="text"
            bind:value={goal3}
            placeholder={`Objectif 3 ${periodLabels[activePeriod]}`}
            class="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white 
                   focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder-gray-500"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={handleClose}
            class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-zinc-700 text-white text-sm font-medium rounded-md hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}