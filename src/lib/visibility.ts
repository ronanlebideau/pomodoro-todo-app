// src/lib/visibility.ts
import { browser } from '$app/environment';

export function onVisibilityChange(callback: (visible: boolean) => void) {
  if (!browser) return () => {}; // no-op côté serveur

  const handle = () => callback(!document.hidden);
  // valeur initiale
  callback(!document.hidden);

  document.addEventListener('visibilitychange', handle);
  return () => document.removeEventListener('visibilitychange', handle);
}
