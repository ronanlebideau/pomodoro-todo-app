/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./src/**/*.svelte",
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Ajoutez vos couleurs personnalisées ici
      },
    },
  },
  plugins: [],
  darkMode: 'class', // ou 'media' selon vos besoins
}
