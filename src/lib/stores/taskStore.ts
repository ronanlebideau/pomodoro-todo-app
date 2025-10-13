import { writable } from 'svelte/store';
import { browser } from '$app/environment';
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

	return {
		subscribe,

		loadTasks: async () => {
			update(state => ({ ...state, loading: true }));
			const tasks = await db.getTasks();
			update(state => ({ ...state, tasks, loading: false }));
		},

		addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
			const id = await db.addTask(task);
			update(state => ({
				...state,
				tasks: [{ ...task, id, createdAt: Date.now(), updatedAt: Date.now() }, ...state.tasks]
			}));
			return id;
		},

		updateTask: async (id: number, updates: Partial<Task>) => {
			await db.updateTask(id, updates);
			update(state => ({
				...state,
				tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
			}));
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
				await db.updateTask(id, { completed: !task.completed });
				update(state => ({
					...state,
					tasks: state.tasks.map(t => 
						t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
					)
				}));
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
