import Dexie, { type Table } from 'dexie';
import { browser } from '$app/environment';

export interface Task {
	id?: number;
	title: string;
	description?: string;
	scheduledDate?: string; // YYYY-MM-DD
	scheduledStartTime?: string; // HH:mm
	scheduledEndTime?: string; // HH:mm
	estimatedMinutes?: number;
	completed: boolean;
	tags: string[];
	priority: 'low' | 'medium' | 'high';
	createdAt: number;
	updatedAt: number;
}

export interface TimeLog {
	id?: number;
	taskId: number;
	startTime: number;
	endTime?: number;
	durationMinutes?: number;
	sessionId?: number; // Link to PomodoroSession if created during Pomodoro
	manual: boolean; // true if manually started, false if from Pomodoro
}

export interface PomodoroSession {
	id?: number;
	taskId?: number;
	type: 'focus' | 'short-break' | 'long-break';
	durationMinutes: number;
	startTime: number;
	endTime?: number;
	completed: boolean;
	interrupted: boolean;
}

export interface DailyGoal {
	id?: number;
	date: string; // YYYY-MM-DD format
	goal1: string;
	goal2: string;
	goal3: string;
	completed1: boolean;
	completed2: boolean;
	completed3: boolean;
	createdAt: number;
	updatedAt: number;
}

// Version temporaire utilisant localStorage pour contourner les problèmes de sécurité macOS 26.0.1
export class PomodoroDatabase {
	private dbName = 'PomodoroTodoApp';

	private get storage(): Storage | null {
		return browser ? localStorage : null;
	}

	constructor() {
		// Ne pas utiliser Dexie pour l'instant à cause des problèmes de sécurité macOS 26.0.1
		if (browser) {
			console.warn('Using localStorage fallback for database due to macOS 26.0.1 security restrictions');
		}
	}

	private getStorageKey(type: string): string {
		return `${this.dbName}_${type}`;
	}

	private generateId(): number {
		return Date.now() + Math.floor(Math.random() * 1000);
	}

	// Méthodes pour les Tasks
	async getTasks(): Promise<Task[]> {
		if (!browser) return [];
		try {
			const data = this.storage!.getItem(this.getStorageKey('tasks'));
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error getting tasks:', error);
			return [];
		}
	}

	async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
		if (!browser) throw new Error('Storage not available');

		const tasks = await this.getTasks();
		const now = Date.now();
		const newTask: Task = {
			...task,
			id: this.generateId(),
			createdAt: now,
			updatedAt: now
		};

		tasks.push(newTask);
		this.storage!.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
		return newTask.id!;
	}

	async updateTask(id: number, updates: Partial<Task>): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		const tasks = await this.getTasks();
		const index = tasks.findIndex(t => t.id === id);

		if (index !== -1) {
			tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
			this.storage!.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
		}
	}

	async deleteTask(id: number): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		// Supprimer la tâche
		const tasks = await this.getTasks();
		const filteredTasks = tasks.filter(t => t.id !== id);
		this.storage!.setItem(this.getStorageKey('tasks'), JSON.stringify(filteredTasks));

		// Supprimer les sessions Pomodoro associées
		const sessions = await this.getPomodoroSessions();
		const filteredSessions = sessions.filter(s => s.taskId !== id);
		this.storage!.setItem(this.getStorageKey('pomodoroSessions'), JSON.stringify(filteredSessions));

		// Supprimer les journaux de temps associés
		const timeLogs = await this.getTimeLogs();
		const filteredTimeLogs = timeLogs.filter(t => t.taskId !== id);
		this.storage!.setItem(this.getStorageKey('timeLogs'), JSON.stringify(filteredTimeLogs));
	}

	async getTask(id: number): Promise<Task | undefined> {
		const tasks = await this.getTasks();
		return tasks.find(t => t.id === id);
	}

	// Méthodes pour les TimeLogs
	async getTimeLogs(): Promise<TimeLog[]> {
		if (!browser) return [];
		try {
			const data = this.storage!.getItem(this.getStorageKey('timeLogs'));
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error getting time logs:', error);
			return [];
		}
	}

	async addTimeLog(timeLog: Omit<TimeLog, 'id'>): Promise<number> {
		if (!browser) throw new Error('Storage not available');

		const timeLogs = await this.getTimeLogs();
		const newTimeLog: TimeLog = {
			...timeLog,
			id: this.generateId()
		};

		timeLogs.push(newTimeLog);
		this.storage!.setItem(this.getStorageKey('timeLogs'), JSON.stringify(timeLogs));
		return newTimeLog.id!;
	}

	async updateTimeLog(id: number, updates: Partial<TimeLog>): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		const timeLogs = await this.getTimeLogs();
		const index = timeLogs.findIndex(t => t.id === id);

		if (index !== -1) {
			timeLogs[index] = { ...timeLogs[index], ...updates };
			this.storage!.setItem(this.getStorageKey('timeLogs'), JSON.stringify(timeLogs));
		}
	}

	// Méthodes pour les PomodoroSessions
	async getPomodoroSessions(): Promise<PomodoroSession[]> {
		if (!browser) return [];
		try {
			const data = this.storage!.getItem(this.getStorageKey('pomodoroSessions'));
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error getting pomodoro sessions:', error);
			return [];
		}
	}

	async addPomodoroSession(session: Omit<PomodoroSession, 'id'>): Promise<number> {
		if (!browser) throw new Error('Storage not available');

		const sessions = await this.getPomodoroSessions();
		const newSession: PomodoroSession = {
			...session,
			id: this.generateId()
		};

		sessions.push(newSession);
		this.storage!.setItem(this.getStorageKey('pomodoroSessions'), JSON.stringify(sessions));
		return newSession.id!;
	}

	async updatePomodoroSession(id: number, updates: Partial<PomodoroSession>): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		const sessions = await this.getPomodoroSessions();
		const index = sessions.findIndex(s => s.id === id);

		if (index !== -1) {
			sessions[index] = { ...sessions[index], ...updates };
			this.storage!.setItem(this.getStorageKey('pomodoroSessions'), JSON.stringify(sessions));
		}
	}

	// Méthodes pour les DailyGoals
	async getDailyGoals(): Promise<DailyGoal[]> {
		if (!browser) return [];
		try {
			const data = this.storage!.getItem(this.getStorageKey('dailyGoals'));
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error getting daily goals:', error);
			return [];
		}
	}

	async addDailyGoal(goal: Omit<DailyGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
		if (!browser) throw new Error('Storage not available');

		const goals = await this.getDailyGoals();
		const now = Date.now();
		const newGoal: DailyGoal = {
			...goal,
			id: this.generateId(),
			createdAt: now,
			updatedAt: now
		};

		goals.push(newGoal);
		this.storage!.setItem(this.getStorageKey('dailyGoals'), JSON.stringify(goals));
		return newGoal.id!;
	}

	async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		const goals = await this.getDailyGoals();
		const index = goals.findIndex(g => g.id === id);

		if (index !== -1) {
			goals[index] = { ...goals[index], ...updates, updatedAt: Date.now() };
			this.storage!.setItem(this.getStorageKey('dailyGoals'), JSON.stringify(goals));
		}
	}

	async getDailyGoalByDate(date: string): Promise<DailyGoal | undefined> {
		const goals = await this.getDailyGoals();
		return goals.find(g => g.date === date);
	}

	// Méthode d'initialisation
	async initialize(): Promise<void> {
		// Vérifier que le stockage local est disponible
		if (!browser) {
			throw new Error('localStorage is not available');
		}
	}
}

// Classe Dexie originale gardée pour référence future
export class DexiePomodoroDatabase extends Dexie {
	tasks!: Table<Task>;
	pomodoroSessions!: Table<PomodoroSession>;
	timeLogs!: Table<TimeLog>;
	dailyGoals!: Table<DailyGoal>;

	constructor() {
		super('PomodoroTodoApp');
		this.version(1).stores({
			tasks: '++id, scheduledDate, completed, createdAt',
			pomodoroSessions: '++id, taskId, startTime, type',
			timeLogs: '++id, taskId, startTime, endTime',
			dailyGoals: '++id, date, createdAt'
		});
	}
}

// Utiliser la version temporaire avec localStorage
export const db = new PomodoroDatabase();
