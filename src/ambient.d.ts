// Déclaration des types pour les éléments Svelte
declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    // Ajoutez ici les attributs personnalisés si nécessaire
    [key: string]: any;
  }
}

// Pour les modules Svelte
declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}
