# 🍅 Rorodoro Todo

> [Lire en français](README.fr.md)

A PWA task management application with Rorodoro timer, daily planning, and time tracking.

## Features

- ✅ **Task Management**: Full CRUD with priorities, tags, dates, and times
- 🍅 **Pomodoro Timer**: 25 min focus / 5 min break / 15 min long break (after 4 sessions)
- ⏱️ **Time Tracking**: Automatic during Pomodoro or manual tracking
- 📅 **Daily Planning**: Timeline view with 30-minute slots
- 📊 **Statistics**: Total time, completed tasks, CSV export
- 📱 **PWA**: Installable on mobile/desktop, works offline
- 🔔 **Notifications**: Alerts for Pomodoro session completion
- 🌙 **Dark theme** by default

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

## Usage

1. **Create Tasks**: Click on "New Task" to add a task
2. **Schedule**: Add a date and start/end times to see the task in the planning
3. **Start Pomodoro**: Click the clock icon on a task to link it to the timer
4. **Track Time**: Use the Play button to start manual tracking
5. **View Stats**: Check the Statistics tab to see your performance

## Technologies

- **SvelteKit** + TypeScript
- **TailwindCSS** for styling
- **Dexie** (IndexedDB) for local storage
- **Lucide** for icons
- **Vite PWA** for PWA features

## Export/Import

- **CSV Export**: Available in the Statistics tab
- Data is stored locally in IndexedDB (persists in the browser)

## Production Build

```bash
npm run build
npm run preview
```
