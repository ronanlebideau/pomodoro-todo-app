import { browser } from '$app/environment';

export function playSound(soundFile: string, volume = 0.5) {
  if (!browser) return;
  
  try {
    const audio = new Audio(`/sounds/${soundFile}`);
    audio.volume = volume;
    
    audio.addEventListener('error', (e) => {
      console.error(`Erreur lors du chargement du son ${soundFile}:`, e);
    });
    
    audio.play().catch(error => {
      console.warn(`Impossible de lire le son ${soundFile}:`, error);
    });
    
    return audio;
  } catch (error) {
    console.warn(`Erreur lors de la lecture du son ${soundFile}:`, error);
  }
}
