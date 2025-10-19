<script lang="ts">
  import { goalsStore } from '$lib/stores/goalsStore';

  export let activePeriod: 'day' | 'week' | 'month' | 'year' = 'day';

  const periods = [
    { id: 'day', label: 'Jour' },
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'year', label: 'Année' }
  ];

  function setPeriod(period: 'day' | 'week' | 'month' | 'year') {
    if (activePeriod === period) return;
    activePeriod = period;
    goalsStore.setActivePeriod(period);
    // Forcer le rechargement des objectifs pour la nouvelle période
    goalsStore.loadGoals();
  }
</script>

<div class="flex gap-2 mb-4">
  {#each periods as period}
    <button
      on:click={() => setPeriod(period.id as any)}
      class="px-3 py-1 text-sm rounded-lg transition-colors {activePeriod === period.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
      data-tooltip="Afficher les objectifs {period.label.toLowerCase()}"
      aria-label="Afficher les objectifs {period.label.toLowerCase()}"
    >
      {period.label}
    </button>
  {/each}
</div>