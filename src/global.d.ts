// Déclaration des types globaux pour Svelte
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    [key: string]: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Déclaration pour les modules Svelte
declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}
