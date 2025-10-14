import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Task, TimeLog } from '$lib/db';

const playAudio = (soundFile: string) => {
	try {
		console.log(`🔊 Attempting to play ${soundFile}...`);
		const audio = new Audio(`/sounds/${soundFile}`);
		audio.volume = 0.5;

		audio.addEventListener('canplaythrough', () => {
			console.log(`🔊 ${soundFile} loaded successfully, attempting to play...`);
		});

		audio.addEventListener('error', (e) => {
			console.error(`🔊 Error playing ${soundFile}:`, e);
		});

		const playPromise = audio.play();

		if (playPromise !== undefined) {
			playPromise
				.then(() => {
					console.log(`🔊 ${soundFile} played successfully!`);
				})
				.catch(error => {
					console.warn(`🔊 Could not play ${soundFile} (autoplay policy?):`, error);
				});
		}
	} catch (error) {
		console.warn(`🔊 Error creating audio element for ${soundFile}:`, error);
	}
};

interface TaskStoreState {
	tasks: Task[];
	activeTimeLog: TimeLog | null;
	loading: boolean;
	pendingSounds: (() => void)[];
}

function createTaskStore() {
	const { subscribe, set, update } = writable<TaskStoreState>({
		tasks: [],
		activeTimeLog: null,
		loading: true,
		pendingSounds: []
	});

	// Gestionnaire global pour jouer les sons en attente après interaction utilisateur
	if (browser) {
		let soundEnabled = false;

		const enableSoundAfterInteraction = () => {
			if (!soundEnabled) {
				soundEnabled = true;
				console.log('🔊 Sound enabled after user interaction');

				// Jouer tous les sons en attente
				update(state => {
					state.pendingSounds.forEach(playSound => playSound());
					return { ...state, pendingSounds: [] };
				});
			}
		};

		// Écouter les interactions utilisateur pour activer le son
		document.addEventListener('click', enableSoundAfterInteraction, { once: true });
		document.addEventListener('keydown', enableSoundAfterInteraction, { once: true });
		document.addEventListener('touchstart', enableSoundAfterInteraction, { once: true });
	}

	return {
		subscribe,

		loadTasks: async () => {
			update(state => ({ ...state, loading: true }));
			const tasks = await db.getTasks();
			update(state => ({ ...state, tasks, loading: false }));
		},

		addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
			const id = await db.addTask(task);
			update(state => {
				// Jouer le son de nouvelle tâche
				setTimeout(() => {
					const soundHandler = () => playAudio('new-task.mp3');
					if (document.visibilityState === 'visible') {
						soundHandler();
					} else {
						// Si l'onglet n'est pas actif, ajouter le son à la file d'attente
						update(s => ({ ...s, pendingSounds: [...s.pendingSounds, soundHandler] }));
					}
				}, 100);

				return {
					...state,
					tasks: [{ ...task, id, createdAt: Date.now(), updatedAt: Date.now() }, ...state.tasks]
				};
			});
			return id;
		},

		updateTask: async (id: number, updates: Partial<Task>) => {
			const isCompletionUpdate = 'completed' in updates;
			await db.updateTask(id, updates);
			update(state => {
				// Ne pas jouer le son pour la complétion (géré par toggleComplete)
				if (!isCompletionUpdate) {
					setTimeout(() => {
						const soundHandler = () => playAudio('new-task.mp3');
						if (document.visibilityState === 'visible') {
							soundHandler();
						} else {
							update(s => ({ ...s, pendingSounds: [...s.pendingSounds, soundHandler] }));
						}
					}, 100);
				}

				return {
					...state,
					tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
				};
			});
		},

		deleteTask: async (id: number) => {
			await db.deleteTask(id);
			update(state => ({
				...state,
				tasks: state.tasks.filter(t => t.id !== id)
			}));
		},

		toggleComplete: async (id: number) => {
			const task = await db.getTask(id);
			if (task) {
				const wasCompleted = task.completed;
				await db.updateTask(id, { completed: !task.completed });
				update(state => ({
					...state,
					tasks: state.tasks.map(t =>
						t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
					)
				}));
				// Jouer le son seulement si la tâche vient d'être marquée comme complétée
				if (!wasCompleted) {
					setTimeout(() => {
						const playSound = () => {
							try {
								const soundHandler = () => playAudio('task-completed.mp3');
								if (document.visibilityState === 'visible') {
									soundHandler();
								} else {
									update(s => ({ ...s, pendingSounds: [...s.pendingSounds, soundHandler] }));
								}
							} catch (error) {
								console.warn('🔊 Error playing completion sound:', error);
							}
						};

						// Vérifier si le son est déjà activé ou ajouter à la file d'attente
						update(state => {
							if (state.pendingSounds.length === 0) {
								// Premier son, essayer de le jouer immédiatement
								playSound();
							} else {
								// Ajouter à la file d'attente
								console.log('🔊 Adding sound to pending queue');
								return { ...state, pendingSounds: [...state.pendingSounds, playSound] };
							}
							return state;
						});
					}, 100);
				}
			}
		},

		// Time tracking
		startTimeTracking: async (taskId: number) => {
			const timeLog: TimeLog = {
				taskId,
				startTime: Date.now(),
				manual: true
			};
			const id = await db.addTimeLog(timeLog);
			update(state => ({
				...state,
				activeTimeLog: { ...timeLog, id }
			}));
		},

		stopTimeTracking: async () => {
			let currentState: TaskStoreState;
			update(state => {
				currentState = state;
				return state;
			});

			if (currentState!.activeTimeLog?.id) {
				const endTime = Date.now();
				const durationMinutes = Math.round(
					(endTime - currentState!.activeTimeLog.startTime) / 60000
				);
				
				await db.updateTimeLog(currentState!.activeTimeLog.id, {
					endTime,
					durationMinutes
				});

				update(state => ({ ...state, activeTimeLog: null }));
			}
		},

		getTaskTimeLogs: async (taskId: number) => {
			const timeLogs = await db.getTimeLogs();
			return timeLogs.filter(log => log.taskId === taskId);
		},

		getTotalTimeForTask: async (taskId: number): Promise<number> => {
			const logs = await db.getTimeLogs();
			return logs
				.filter(log => log.taskId === taskId && log.durationMinutes)
				.reduce((total, log) => total + log.durationMinutes!, 0);
		},

		exportToCSV: async () => {
			if (!browser) return; // pas de DOM côté serveur
			const tasks = await db.getTasks();
			const timeLogs = await db.getTimeLogs();

			// Create CSV content
			let csv = 'Task ID,Title,Description,Completed,Tags,Priority,Created,Total Minutes\n';

			for (const task of tasks) {
				const taskLogs = timeLogs.filter(log => log.taskId === task.id && log.durationMinutes);
				const totalMinutes = taskLogs.reduce((total, log) => total + log.durationMinutes!, 0);
				const row = [
					task.id,
					`"${task.title.replace(/"/g, '""')}"`,
					`"${(task.description || '').replace(/"/g, '""')}"`,
					task.completed,
					`"${task.tags.join(', ')}"`,
					task.priority,
					new Date(task.createdAt).toISOString(),
					totalMinutes
				].join(',');
				csv += row + '\n';
			}

			// Download CSV
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pomodoro-tasks-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},

		downloadJson: (filename: string, data: string) => {
			if (!browser) return; // pas de DOM côté serveur
			const a = document.createElement('a');
			a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
	};
}

export const taskStore = createTaskStore();
