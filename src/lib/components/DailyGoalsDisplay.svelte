<script lang="ts">
  import { goalsStore } from '$lib/stores/goalsStore';
  import { CheckCircle2, Circle, Target, Edit3 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import GoalPeriodTabs from './GoalPeriodTabs.svelte';

  let activePeriod: 'day' | 'week' | 'month' | 'year' = 'day';
  let currentGoals = $goalsStore.currentGoals[activePeriod];
  let loading = $goalsStore.loading;

  onMount(() => {
    goalsStore.loadGoals();
  });

  $: currentGoals = $goalsStore.currentGoals[activePeriod];
  $: loading = $goalsStore.loading;
  
  // Recharger les objectifs quand la période active change
  $: if (activePeriod) {
    goalsStore.loadGoals();
  }

  function toggleGoal(goalNumber: 1 | 2 | 3) {
    if (!currentGoals) return;
    goalsStore.toggleGoalCompletion(activePeriod, goalNumber);
  }

  function editGoal(goalNumber: 1 | 2 | 3) {
    goalsStore.showGoalsModal(activePeriod, goalNumber);
  }

  function editGoals() {
    goalsStore.showGoalsModal(activePeriod);
  }

  function getGoalStatus(goalNumber: 1 | 2 | 3): boolean {
    if (!currentGoals) return false;
    return currentGoals[`completed${goalNumber}` as const] || false;
  }

  function getGoalText(goalNumber: 1 | 2 | 3): string {
    if (!currentGoals) return '';
    return currentGoals[`goal${goalNumber}` as const] || '';
  }

  function hasGoal(goalNumber: 1 | 2 | 3): boolean {
    return getGoalText(goalNumber).trim() !== '';
  }
</script>

<div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-4">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <Target class="w-5 h-5 text-blue-400" />
      <h3 class="font-medium text-white">Objectifs</h3>
    </div>
    <button
      on:click={editGoals}
      class="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-md transition-colors"
    >
      <Edit3 class="w-3 h-3" />
      Modifier
    </button>
  </div>

  <GoalPeriodTabs bind:activePeriod />

  {#if loading}
    <div class="text-center py-4 text-gray-400">Chargement...</div>
  {:else if currentGoals}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {#each [1, 2, 3] as goalNumber (goalNumber)}
        <div class="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 h-40">
          <div class="flex flex-col items-center justify-center h-full w-full gap-3">
            <!-- Case à cocher centrée en haut -->
            <button
              on:click|stopPropagation={() => hasGoal(goalNumber as 1 | 2 | 3) && toggleGoal(goalNumber as 1 | 2 | 3)}
              class="focus:outline-none"
              aria-label={getGoalStatus(goalNumber as 1 | 2 | 3) ? 'Marquer comme non complété' : 'Marquer comme complété'}
            >
              {#if hasGoal(goalNumber as 1 | 2 | 3)}
                {#if getGoalStatus(goalNumber as 1 | 2 | 3)}
                  <CheckCircle2 class="w-6 h-6 text-green-400" />
                {:else}
                  <Circle class="w-6 h-6 text-neutral-400 hover:text-neutral-300 transition-colors" />
                {/if}
              {/if}
            </button>
            
            <!-- Zone de texte cliquable en dessous -->
            <button
              on:click={() => editGoal(goalNumber as 1 | 2 | 3)}
              class="w-full  flex items-center justify-center text-center hover:bg-neutral-800/50 rounded-lg p-2 -mx-2"
            >
              {#if hasGoal(goalNumber as 1 | 2 | 3)}
                <span class="text-sm text-white/90 leading-relaxed {getGoalStatus(goalNumber as 1 | 2 | 3) ? 'line-through opacity-60' : ''}">
                  {getGoalText(goalNumber as 1 | 2 | 3)}
                </span>
              {:else}
                <span class="text-sm text-neutral-500 italic">Cliquez pour ajouter un objectif</span>
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-4 text-gray-400">Aucun objectif défini</div>
  {/if}
</div>