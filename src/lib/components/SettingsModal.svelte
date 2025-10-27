<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores/settingsStore';
  import { generateColorVariations } from '$lib/utils/colorUtils';
  import ColorPicker from './ColorPicker.svelte';
  import { fade, fly } from 'svelte/transition';
  
  // Interface pour typer les sons
  interface SoundSettings {
    // Sons des tâches
    taskAdd: string;
    taskComplete: string;
    taskDelete: string;
    
    // Sons du minuteur
    timerStart: string;
    timerPause: string;
    timerResume: string;
    timerComplete: string;
    
    // Son d'ambiance
    ambient: string;
    
    // Volume et activation
    volume: number;
    enabled: boolean;
  }
  
  // Type pour les clés de son
  type SoundKey = keyof Omit<SoundSettings, 'volume' | 'enabled'>;
  
  export let isOpen = false;
  
  // Références aux éléments audio
  let audioElements: Partial<Record<SoundKey, HTMLAudioElement>> = {};
  
  // État local pour la section active
  let activeSoundSection = 'tasks'; // 'tasks' ou 'timer' ou 'ambient'
  
  // État local pour le thème
  let localTheme = {
    accent: '#8b5cf6',
    accentVariations: {} as Record<string, string>
  };
  
  // État local pour les sons
  let localSounds: SoundSettings = {
    // Sons des tâches
    taskAdd: '',
    taskComplete: '',
    taskDelete: '',
    
    // Sons du minuteur
    timerStart: '',
    timerPause: '',
    timerResume: '',
    timerComplete: '',
    
    // Son d'ambiance
    ambient: '',
    
    // Volume et activation
    volume: 0.5,
    enabled: true
  };
  
  // Suivi des modifications
  let hasChanges = false;
  let initialSettings: any = null;
  
  // Fonction pour vérifier les changements
  function checkForChanges() {
    if (!initialSettings) return false;
    
    // Vérifier les changements dans le thème
    if (localTheme.accent !== initialSettings.theme.accent) return true;
    
    // Vérifier les changements dans les sons
    const soundKeys: (keyof SoundSettings)[] = [
      ...getSoundKeys('tasks'), 
      ...getSoundKeys('timer'), 
      ...getSoundKeys('ambient'), 
      'volume', 
      'enabled'
    ];
    
    for (const key of soundKeys) {
      if (localSounds[key] !== initialSettings.sounds[key]) {
        return true;
      }
    }
    
    return false;
  }
  
  // Mettre à jour l'état des changements
  $: if (isOpen) {
    hasChanges = checkForChanges();
  }
  
  // Initialiser avec les valeurs actuelles lors de l'ouverture de la modale
  $: if (isOpen) {
    // Sauvegarder les paramètres initiaux pour la comparaison
    if (!initialSettings) {
      initialSettings = JSON.parse(JSON.stringify({
        theme: { ...$settings.theme },
        sounds: { ...$settings.sounds }
      }));
    }
    
    // Thème
    localTheme = { 
      ...$settings.theme,
      accentVariations: $settings.theme.accentVariations || {}
    };
    
    // Sons
    localSounds = {
      ...localSounds,
      ...$settings.sounds
    };
  }
  
  // Jouer un son de prévisualisation
  async function playSound(soundKey: SoundKey) {
    if (!localSounds.enabled) return;
    
    try {
      // Arrêter le son s'il est déjà en cours de lecture
      if (audioElements[soundKey]) {
        audioElements[soundKey].pause();
        audioElements[soundKey].currentTime = 0;
      }
      
      // Créer une nouvelle instance Audio
      const audio = new Audio(localSounds[soundKey]);
      audio.volume = localSounds.volume;
      
      // Si c'est le son d'ambiance, on le met en boucle
      if (soundKey === 'ambient') {
        audio.loop = true;
      }
      
      // Lire le son
      await audio.play();
      
      // Stocker la référence
      audioElements[soundKey] = audio;
    } catch (error) {
      console.error(`Erreur lors de la lecture du son ${soundKey}:`, error);
    }
  }
  
  // Arrêter un son
  function stopSound(soundKey: SoundKey) {
    if (audioElements[soundKey]) {
      audioElements[soundKey].pause();
      audioElements[soundKey].currentTime = 0;
    }
  }
  
  // Gestion du changement de fichier audio
  async function handleSoundChange(event: Event, soundKey: SoundKey) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const url = URL.createObjectURL(file);
      localSounds = {
        ...localSounds,
        [soundKey]: url
      };
      hasChanges = true;
      
      // Mettre à jour le store immédiatement pour prévisualisation
      settings.update(s => ({
        ...s,
        sounds: {
          ...s.sounds,
          [soundKey]: url
        }
      }));
      
      // Réinitialiser l'input pour permettre la sélection du même fichier à nouveau
      (event.target as HTMLInputElement).value = '';
    } catch (e) {
      console.error('Erreur lors du chargement du son :', e);
    }
  }
  
  // Mettre à jour le volume
  function updateVolume(volume: number) {
    localSounds.volume = volume;
    
    // Mettre à jour le volume de tous les lecteurs audio
    Object.values(audioElements).forEach(audio => {
      audio.volume = volume;
    });
    
    hasChanges = true;
  }
  
  // Basculer l'activation des sons
  function toggleSounds() {
    localSounds.enabled = !localSounds.enabled;
    hasChanges = true;
    
    // Si on désactive les sons, arrêter tous les lecteurs
    if (!localSounds.enabled) {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }
  
  async function handleNotificationSoundChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const url = URL.createObjectURL(file);
      // Mettre à jour le store avec la nouvelle URL
      settings.update(s => ({
        ...s,
        notificationSound: url
      }));
      
      // Réinitialiser l'input pour permettre la sélection du même fichier à nouveau
      (event.target as HTMLInputElement).value = '';
    } catch (e) {
      console.error('Erreur lors du chargement du son :', e);
    }
  }
  
  async function handleAmbientSoundChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const url = URL.createObjectURL(file);
      // Mettre à jour le store avec la nouvelle URL
      settings.update(s => ({
        ...s,
        ambientSound: url
      }));
      
      // Réinitialiser l'input pour permettre la sélection du même fichier à nouveau
      (event.target as HTMLInputElement).value = '';
    } catch (e) {
      console.error('Erreur lors du chargement du son :', e);
    }
  }
  
  function handleColorChange(event: CustomEvent) {
    const { name, value } = event.detail;
    if (name in localTheme) {
      localTheme = { ...localTheme, [name]: value };
      hasChanges = true;
      
      // Update preview
      updateCssVariables({
        ...$settings.theme,
        [name]: value
      });
    }
  }
  
  function updateCssVariables(customTheme?: typeof $settings.theme) {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const theme = customTheme || $settings.theme;
    const { accent } = theme;
    
    // Update accent color
    root.style.setProperty('--color-accent', accent);
    
    // Generate and update color variations
    try {
      const variations = generateColorVariations(accent);
      Object.entries(variations).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--color-accent-${key}`, value);
        }
      });
    } catch (e) {
      console.error('Erreur lors de la génération des variations de couleurs :', e);
    }
  }
  
  // Mettre à jour les variables CSS au chargement du composant
  onMount(() => {
    updateCssVariables();
  });
  
  function closeModal() {
    // Reset to original values when closing without saving
    if (hasChanges) {
      updateCssVariables();
    }
    isOpen = false;
  }
  
  function applyChanges() {
    // Générer les variations de couleurs
    const themeWithVariations = {
      ...localTheme,
      accentVariations: generateColorVariations(localTheme.accent)
    };
    
    // Mettre à jour le store avec les nouvelles valeurs
    settings.update(s => ({
      ...s,
      theme: themeWithVariations,
      sounds: {
        ...s.sounds,
        ...localSounds
      }
    }));
    
    // Réinitialiser les paramètres initiaux
    initialSettings = JSON.parse(JSON.stringify({
      theme: { ...localTheme, accentVariations: themeWithVariations.accentVariations },
      sounds: { ...localSounds }
    }));
    
    hasChanges = false;
    updateCssVariables(); // Mettre à jour les variables CSS
    
    // Fermer la modale après la sauvegarde
    isOpen = false;
  }
  
  // Empêcher la fermeture de la modale lors d'un clic à l'intérieur
  function handleContentClick(e: Event) {
    e.stopPropagation();
  }
  
  // Formater le nom du son pour l'affichage
  function formatSoundName(key: string): string {
    const names: Record<string, string> = {
      taskAdd: 'Ajout de tâche',
      taskComplete: 'Tâche terminée',
      taskDelete: 'Suppression de tâche',
      timerStart: 'Démarrage du minuteur',
      timerPause: 'Mise en pause',
      timerResume: 'Reprise du minuteur',
      timerComplete: 'Minuteur terminé',
      ambient: 'Ambiance de travail'
    };
    return names[key] || key;
  }
  
  // Fonction utilitaire pour obtenir les clés de son par catégorie
  function getSoundKeys(category: 'tasks' | 'timer' | 'ambient'): SoundKey[] {
    const soundMap = {
      tasks: ['taskAdd', 'taskComplete', 'taskDelete'] as const,
      timer: ['timerStart', 'timerPause', 'timerResume', 'timerComplete'] as const,
      ambient: ['ambient'] as const
    };
    
    return soundMap[category] as unknown as SoundKey[];
  }
</script>

{#if isOpen}
  <!-- Overlay -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    on:click={closeModal}
    on:keydown={(e) => e.key === 'Escape' && closeModal()}
    role="presentation"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div 
      class="bg-zinc-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl focus:outline-none"
      on:click={handleContentClick}
      on:keydown={(e) => e.key === 'Escape' && closeModal()}
      role="dialog"
      aria-labelledby="settings-modal-title"
      aria-modal="true"
      tabindex="0"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 id="settings-modal-title" class="text-2xl font-bold text-white">Paramètres</h2>
        <button 
          on:click={closeModal}
          class="text-zinc-400 hover:text-white"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      
      <div class="space-y-6">
        <!-- Section Sons (Désactivée) -->
        <div class="bg-zinc-800/50 p-4 rounded-lg opacity-50">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-white">Sons</h3>
            <div class="relative inline-flex items-center">
              <div class="w-11 h-6 bg-zinc-600 rounded-full"></div>
              <span class="ml-3 text-sm font-medium text-zinc-500">Désactivés</span>
            </div>
          </div>
          
          <div class="bg-zinc-800/70 p-4 rounded-lg text-center">
            <p class="text-zinc-400 text-sm">
              La personnalisation des sons sera disponible dans une prochaine mise à jour.
            </p>
            <p class="text-zinc-500 text-xs mt-2">
              Vous pourrez bientôt personnaliser les sons des tâches, du minuteur et ajouter une ambiance sonore.
            </p>
          </div>
        </div>
        
        <!-- Section Thème -->
        <div class="bg-zinc-800/50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-white mb-4">Thème</h3>
          
          <div class="space-y-4">
            
            <div class="mb-4">
              <ColorPicker 
                label="Couleur d'accent"
                bind:value={localTheme.accent}
                on:change={(e) => handleColorChange(new CustomEvent('colorChange', { detail: { name: 'accent', value: e.detail.value }}))}
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Boutons d'action -->
      <div class="mt-6 pt-4 border-t border-zinc-700 flex justify-between">
        <button 
          on:click|stopPropagation={closeModal}
          class="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          type="button"
        >
          Annuler
        </button>
        
        <div class="space-x-2">
          <button 
            on:click|stopPropagation={() => {
              const defaultTheme = { 
                accent: '#8b5cf6',
                accentVariations: generateColorVariations('#8b5cf6')
              };
              localTheme = defaultTheme;
              hasChanges = true;
              updateCssVariables(defaultTheme);
            }}
            class="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={!hasChanges}
          >
            Réinitialiser
          </button>
          
          <button 
            on:click|stopPropagation={applyChanges}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={!hasChanges}
          >
            {hasChanges ? 'Appliquer les changements' : 'Aucun changement'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

