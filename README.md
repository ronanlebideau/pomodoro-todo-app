# 🍅 Pomodoro Todo App

Application PWA de gestion de tâches avec timer Pomodoro, planning journalier et tracking du temps.

## Fonctionnalités

- ✅ **Gestion de tâches** : CRUD complet avec priorités, tags, dates et heures
- 🍅 **Timer Pomodoro** : 25 min focus / 5 min pause / 15 min pause longue (après 4 sessions)
- ⏱️ **Time tracking** : Automatique pendant Pomodoro ou manuel
- 📅 **Planning journalier** : Vue timeline avec slots de 30 minutes
- 📊 **Statistiques** : Temps total, tâches complétées, export CSV
- 📱 **PWA** : Installable sur mobile/desktop, fonctionne offline
- 🔔 **Notifications** : Alertes de fin de session Pomodoro
- 🌙 **Thème sombre** par défaut

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Ouvrir dans le navigateur
npm run dev -- --open
```

## Utilisation

1. **Créer des tâches** : Cliquez sur "Nouvelle tâche" pour ajouter une tâche
2. **Planifier** : Ajoutez une date et des heures de début/fin pour voir la tâche dans le planning
3. **Démarrer Pomodoro** : Cliquez sur l'icône horloge d'une tâche pour la lier au timer
4. **Tracker le temps** : Utilisez le bouton Play pour démarrer le tracking manuel
5. **Voir les stats** : Onglet Statistiques pour voir vos performances

## Technologies

- **SvelteKit** + TypeScript
- **TailwindCSS** pour le style
- **Dexie** (IndexedDB) pour le stockage local
- **Lucide** pour les icônes
- **Vite PWA** pour les fonctionnalités PWA

## Export/Import

- **Export CSV** : Disponible dans l'onglet Statistiques
- Les données sont stockées localement dans IndexedDB (persistent dans le navigateur)

## Build Production

```bash
npm run build
npm run preview
```
