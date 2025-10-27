import { writable } from 'svelte/store';

// Fonction pour générer des variations de couleur
function generateColorVariations(baseColor: string) {
  // Convertir la couleur hex en RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  // Convertir RGB en HSL pour les variations
  const { r, g, b } = hexToRgb(baseColor);
  
  const r_ = r / 255;
  const g_ = g / 255;
  const b_ = b / 255;
  
  const max = Math.max(r_, g_, b_);
  const min = Math.min(r_, g_, b_);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatique
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r_: h = (g_ - b_) / d + (g_ < b_ ? 6 : 0); break;
      case g_: h = (b_ - r_) / d + 2; break;
      case b_: h = (r_ - g_) / d + 4; break;
    }
    
    h! /= 6;
  }
  
  // Générer des variations de luminosité
  const variations: Record<string, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  steps.forEach(step => {
    // Ajuster la luminosité en fonction du pas
    let l_ = l;
    if (step < 500) {
      l_ = l + (1 - l) * (500 - step) / 500;
    } else if (step > 500) {
      l_ = l * (1 - (step - 500) / 500);
    }
    
    // Convertir HSL vers RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l_; // achromatique
    } else {
      const q = l_ < 0.5 ? l_ * (1 + s) : l_ + s - l_ * s;
      const p = 2 * l_ - q;
      
      r = hue2rgb(p, q, h! + 1/3);
      g = hue2rgb(p, q, h!);
      b = hue2rgb(p, q, h! - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    variations[step] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });
  
  return variations;
}

// Valeurs par défaut
const defaultSettings = {
  sounds: {
    // Sons des tâches
    taskAdd: '/sounds/notification-ping-372479.mp3',
    taskComplete: '/sounds/notification-ping-372479.mp3',
    taskDelete: '/sounds/notification-ping-372479.mp3',
    
    // Sons du minuteur
    timerStart: '/sounds/notification-ping-372479.mp3',
    timerPause: '/sounds/notification-ping-372479.mp3',
    timerResume: '/sounds/notification-ping-372479.mp3',
    timerComplete: '/sounds/notification-ping-372479.mp3',
    
    // Son d'ambiance
    ambient: '/sounds/loop-audio-focus.mp3',
    
    // Volume par défaut (0.0 à 1.0)
    volume: 0.5,
    
    // Activer/désactiver les sons
    enabled: true
  },
  
  theme: {
    accent: '#8b5cf6', // violet-500
    accentVariations: generateColorVariations('#8b5cf6'),
  },
};

// Fonction pour charger les paramètres depuis le localStorage
function loadSettings() {
  if (typeof window === 'undefined') return defaultSettings;
  
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur lors du chargement des paramètres', e);
      return defaultSettings;
    }
  }
  return defaultSettings;
}

// Créer le store avec les paramètres chargés
const createSettingsStore = () => {
  const { subscribe, set, update } = writable(loadSettings());

  // Fonction pour sauvegarder les paramètres dans le localStorage
  const save = (settings: typeof defaultSettings) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-settings', JSON.stringify(settings));
    }
    return settings;
  };

  return {
    subscribe,
    update: (updater: (settings: typeof defaultSettings) => typeof defaultSettings) => {
      update(settings => save(updater(settings)));
    },
    reset: () => {
      set(save(defaultSettings));
    },
    setTheme: (theme: typeof defaultSettings.theme) => {
      update(settings => save({
        ...settings,
        theme: { ...settings.theme, ...theme }
      }));
    },
    // Sons
    setSoundSetting: (soundKey: string, value: string | number | boolean) => {
      update(settings => {
        const newSettings = {
          ...settings,
          sounds: {
            ...settings.sounds,
            [soundKey]: value
          }
        };
        return save(newSettings);
      });
    },
    
    // Raccourcis pratiques
    setSoundVolume: (volume: number) => {
      update(settings => save({
        ...settings,
        sounds: {
          ...settings.sounds,
          volume: Math.max(0, Math.min(1, volume)) // S'assure que le volume est entre 0 et 1
        }
      }));
    },
    
    toggleSounds: (enabled?: boolean) => {
      update(settings => save({
        ...settings,
        sounds: {
          ...settings.sounds,
          enabled: enabled !== undefined ? enabled : !settings.sounds.enabled
        }
      }));
    }
  };
};

export const settings = createSettingsStore();

// Mettre à jour les variables CSS lorsque les paramètres changent
settings.subscribe($settings => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const { accent } = $settings.theme;
    
    // Mettre à jour la couleur d'accent
    root.style.setProperty('--color-accent', accent);
    
    // Mettre à jour les variations de la couleur d'accent
    const variations = generateColorVariations(accent);
    $settings.theme.accentVariations = variations;
    
    // Mettre à jour les variables CSS pour les variations
    Object.entries(variations).forEach(([key, value]) => {
      root.style.setProperty(`--color-accent-${key}`, value);
    });
  }
});
