import { writable } from 'svelte/store';
import { db } from '$lib/db';
import type { Task, TimeLog } from '$lib/db';

interface TaskStoreState {
	tasks: Task[];
	activeTimeLog: TimeLog | null;
	loading: boolean;
}

function createTaskStore() {
	const { subscribe, set, update } = writable<TaskStoreState>({
		tasks: [],
		activeTimeLog: null,
		loading: true
	});

	// Play task completion sound
	function playTaskCompleteSound() {
		if (typeof window === 'undefined') return;

		try {
			const audio = new Audio('/src/sounds/notification-ping-372479.mp3');
			audio.volume = 0.3; // Volume modéré pour ne pas être trop agressif
			audio.play().catch(error => {
				console.warn('Could not play task completion sound:', error);
			});
		} catch (error) {
			console.warn('Could not create audio for task completion sound:', error);
		}
	}

	return {
		subscribe,

		loadTasks: async () => {
			update(state => ({ ...state, loading: true }));
			const tasks = await db.tasks.orderBy('createdAt').reverse().toArray();
			update(state => ({ ...state, tasks, loading: false }));
		},

		addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
			const now = Date.now();
			const newTask: Task = {
				...task,
				createdAt: now,
				updatedAt: now
			};
			const id = await db.tasks.add(newTask);
			update(state => ({
				...state,
				tasks: [{ ...newTask, id: id as number }, ...state.tasks]
			}));
			return id;
		},

		updateTask: async (id: number, updates: Partial<Task>) => {
			await db.tasks.update(id, { ...updates, updatedAt: Date.now() });
			update(state => ({
				...state,
				tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
			}));
		},

		deleteTask: async (id: number) => {
			await db.tasks.delete(id);
			update(state => ({
				...state,
				tasks: state.tasks.filter(t => t.id !== id)
			}));
		},

		toggleComplete: async (id: number) => {
			const task = await db.tasks.get(id);
			if (task) {
				const wasCompleted = task.completed;
				const now = Date.now();
				const updates: any = { completed: !task.completed, updatedAt: now };

				// Si la tâche devient terminée (passe de false à true), enregistrer la date de clôture
				if (!wasCompleted) {
					updates.completedAt = now;
				}

				await db.tasks.update(id, updates);
				update(state => ({
					...state,
					tasks: state.tasks.map(t => 
						t.id === id ? { ...t, ...updates } : t
					)
				}));
				
				// Play sound only when task becomes completed (not when uncompleted)
				if (!wasCompleted && !task.completed) {
					playTaskCompleteSound();
				}
			}
		},

		// Time tracking
		startTimeTracking: async (taskId: number) => {
			const timeLog: TimeLog = {
				taskId,
				startTime: Date.now()
			};
			const id = await db.timeLogs.add(timeLog);
			update(state => ({
				...state,
				activeTimeLog: { ...timeLog, id: id as number }
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
				
				await db.timeLogs.update(currentState!.activeTimeLog.id, {
					endTime,
					durationMinutes
				});

				update(state => ({ ...state, activeTimeLog: null }));
			}
		},

		getTaskTimeLogs: async (taskId: number) => {
			return await db.timeLogs.where('taskId').equals(taskId).toArray();
		},

		getTotalTimeForTask: async (taskId: number): Promise<number> => {
			const logs = await db.timeLogs.where('taskId').equals(taskId).toArray();
			return logs.reduce((total, log) => {
				if (log.durationMinutes) {
					return total + log.durationMinutes;
				}
				return total;
			}, 0);
		},

		exportToCSV: async () => {
			// Ensure we're in browser environment
			if (typeof window === 'undefined' || typeof document === 'undefined') {
				console.warn('exportToCSV can only be called in browser environment');
				return;
			}

			const tasks = await db.tasks.toArray();
			const timeLogs = await db.timeLogs.toArray();

			// Pré-calculer les totaux pour éviter les requêtes individuelles
			const taskTimeTotals = new Map<number, number>();
			for (const log of timeLogs) {
				if (log.taskId !== undefined) {
					const current = taskTimeTotals.get(log.taskId) || 0;
					taskTimeTotals.set(log.taskId, current + (log.durationMinutes || 0));
				}
			}

			// Create CSV content
			let csv = 'Task ID,Title,Description,Completed,Tags,Priority,Created,Total Minutes\n';

			for (const task of tasks) {
				const totalMinutes = taskTimeTotals.get(task.id!) || 0;
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
			a.click();
			URL.revokeObjectURL(url);
		}
	};
}

export const taskStore = createTaskStore();
