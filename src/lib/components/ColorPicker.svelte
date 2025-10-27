<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value: string;
  export let label: string;
  // La propriété name n'est pas utilisée, donc nous la supprimons
  
  // Créer un ID unique pour associer le label à l'input
  const inputId = `color-${Math.random().toString(36).substr(2, 9)}`;
  
  const dispatch = createEventDispatcher();
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    dispatch('change', { value: target.value });
  }
</script>

<div class="mb-4">
  <label for={inputId} class="block text-sm font-medium text-zinc-300 mb-2">
    {label}
  </label>
  <div class="flex items-center space-x-2">
    <div class="relative">
      <input
        id={inputId}
        type="color"
        bind:value
        on:input={handleInput}
        class="w-10 h-10 rounded border border-zinc-700 cursor-pointer"
        aria-label={`Sélectionner la ${label.toLowerCase()}`}
      />
    </div>
    <div class="flex-1">
      <input
        type="text"
        bind:value
        on:input={handleInput}
        class="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="#RRGGBB"
        maxlength="7"
        aria-label={`Valeur hexadécimale de la ${label.toLowerCase()}`}
      />
    </div>
  </div>
</div>
