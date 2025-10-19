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

export interface Goal {
  id?: number;
  date: string; // Date de création
  period: 'day' | 'week' | 'month' | 'year';
  goal1: string;
  goal2: string;
  goal3: string;
  completed1: boolean;
  completed2: boolean;
  completed3: boolean;
  createdAt: number;
  updatedAt: number;
  // Pour les objectifs hebdomadaires, mensuels, annuels
  startDate?: string; // Date de début de la période
  endDate?: string;   // Date de fin de la période
}

export interface DailyGoal extends Omit<Goal, 'period'> {
	period: 'day';
}

export interface WeeklyGoal extends Omit<Goal, 'period'> {
	period: 'week';
}

export interface MonthlyGoal extends Omit<Goal, 'period'> {
	period: 'month';
}

export interface YearlyGoal extends Omit<Goal, 'period'> {
	period: 'year';
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

	private getStorageKey(type: string, period?: string): string {
		return period ? `${this.dbName}_${type}_${period}` : `${this.dbName}_${type}`;
	}

	private generateId(): number {
		return Date.now() + Math.floor(Math.random() * 1000);
	}

	async getGoalByDate(period: 'day' | 'week' | 'month' | 'year', date: string): Promise<Goal | null> {
		if (!browser) return null;
		try {
			const key = this.getStorageKey('goals', period);
			const goals = JSON.parse(this.storage!.getItem(key) || '[]') as Goal[];
			return goals.find(goal => goal.date === date) || null;
		} catch (error) {
			console.error('Error getting goal by date:', error);
			return null;
		}
	}

	async addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
		if (!browser) throw new Error('Storage not available');

		try {
			const key = this.getStorageKey('goals', goal.period);
			const goals = JSON.parse(this.storage!.getItem(key) || '[]') as Goal[];
			const now = Date.now();
			const newGoal: Goal = {
				...goal,
				id: this.generateId(),
				createdAt: now,
				updatedAt: now
			};

			goals.push(newGoal);
			this.storage!.setItem(key, JSON.stringify(goals));
			return newGoal.id!;
		} catch (error) {
			console.error('Error adding goal:', error);
			throw error;
		}
	}

	async updateGoal(
		id: number, 
		period: 'day' | 'week' | 'month' | 'year',
		updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'period'>>
	): Promise<void> {
		console.log('updateGoal called', { id, period, updates });
		if (!browser) throw new Error('Storage not available');

		try {
			const key = this.getStorageKey('goals', period);
			console.log('Storage key:', key);
			
			const goalsStr = this.storage!.getItem(key) || '[]';
			console.log('Raw goals from storage:', goalsStr);
			
			const goals = JSON.parse(goalsStr) as Goal[];
			console.log('Parsed goals:', goals);
			
			const index = goals.findIndex(g => g.id === id);
			console.log('Found goal at index:', index);

			if (index !== -1) {
				// Créer une copie des mises à jour pour éviter de modifier l'objet d'origine
				const safeUpdates = { ...updates };
				
				// S'assurer que les champs de complétion sont des booléens
				if ('completed1' in safeUpdates) {
					safeUpdates.completed1 = Boolean(safeUpdates.completed1);
				}
				if ('completed2' in safeUpdates) {
					safeUpdates.completed2 = Boolean(safeUpdates.completed2);
				}
				if ('completed3' in safeUpdates) {
					safeUpdates.completed3 = Boolean(safeUpdates.completed3);
				}

				const updatedGoal: Goal = { 
					...goals[index],
					...safeUpdates,
					updatedAt: Date.now() 
				};

				console.log('Updated goal:', updatedGoal);
				
				// Mettre à jour le tableau des objectifs
				const updatedGoals = [...goals];
				updatedGoals[index] = updatedGoal;
				
				const newGoalsStr = JSON.stringify(updatedGoals);
				console.log('Saving to storage:', newGoalsStr);
				
				this.storage!.setItem(key, newGoalsStr);
				console.log('Successfully saved to storage');
			} else {
				console.warn('Goal not found with id:', id);
			}
		} catch (error) {
			console.error('Error updating goal:', error);
			throw error;
		}
	}

	async getGoals(period: 'day' | 'week' | 'month' | 'year'): Promise<Goal[]> {
		if (!browser) return [];
		try {
			const key = this.getStorageKey('goals', period);
			return JSON.parse(this.storage!.getItem(key) || '[]') as Goal[];
		} catch (error) {
			console.error('Error getting goals:', error);
			return [];
		}
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
			if (!data) return [];
			// S'assurer que les données sont bien un tableau
			const parsed = JSON.parse(data);
			return Array.isArray(parsed) ? parsed : [];
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

		// Vérifier si un objectif existe déjà pour cette date
		const existingIndex = goals.findIndex(g => g.date === goal.date);
		
		if (existingIndex >= 0) {
			// Mettre à jour l'objectif existant
			goals[existingIndex] = { ...goals[existingIndex], ...newGoal };
		} else {
			// Ajouter un nouvel objectif
			goals.push(newGoal);
		}

		this.storage!.setItem(this.getStorageKey('dailyGoals'), JSON.stringify(goals));
		return newGoal.id!;
	}

	async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<void> {
		if (!browser) throw new Error('Storage not available');

		const goals = await this.getDailyGoals();
		const index = goals.findIndex(g => g.id === id);

		if (index !== -1) {
			const updatedGoal = { 
				...goals[index], 
				...updates, 
				updatedAt: Date.now() 
			};
			goals[index] = updatedGoal;
			this.storage!.setItem(this.getStorageKey('dailyGoals'), JSON.stringify(goals));
		}
	}

	async getDailyGoalByDate(date: string): Promise<DailyGoal | undefined> {
		const goals = await this.getDailyGoals();
		// Normaliser la date pour la comparaison (au cas où le format varie)
		const normalizedDate = new Date(date).toISOString().split('T')[0];
		return goals.find(g => {
			const goalDate = new Date(g.date).toISOString().split('T')[0];
			return goalDate === normalizedDate;
		});
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
  
  private storage = localStorage;
  
  private generateId(): number {
    return Math.floor(Math.random() * 1000000);
  }
  
  private getStorageKey(key: string): string {
    return `pomodoro-todo-${key}`;
  }

	constructor() {
		super('PomodoroTodoApp');
		this.version(1).stores({
			tasks: '++id, scheduledDate, completed, createdAt',
			pomodoroSessions: '++id, taskId, startTime, type',
			timeLogs: '++id, taskId, startTime, endTime',
			dailyGoals: '++id, date, createdAt'
		});
	}
	// Ajoutez ces méthodes à votre classe PomodoroDatabase

async getGoalByDate(period: 'day' | 'week' | 'month' | 'year', date: string): Promise<Goal | null> {
  if (!browser) return null;
  
  try {
    const goals = await this.getGoals(period);
    const targetDate = new Date(date);
    
    return goals.find(goal => {
      if (period === 'day') {
        return goal.date === targetDate.toISOString().split('T')[0];
      } else if (goal.startDate && goal.endDate) {
        const start = new Date(goal.startDate);
        const end = new Date(goal.endDate);
        return targetDate >= start && targetDate <= end;
      }
      return false;
    }) || null;
  } catch (error) {
    console.error(`Error getting ${period} goal:`, error);
    return null;
  }
}

async addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  if (!browser) throw new Error('Storage not available');

  const goals = await this.getGoals(goal.period);
  const now = Date.now();
  const newGoal: Goal = {
    ...goal,
    id: this.generateId(),
    createdAt: now,
    updatedAt: now
  };

  // Vérifier si un objectif existe déjà pour cette période
  const existingIndex = goals.findIndex(g => {
    if (goal.period === 'day') {
      return g.date === goal.date;
    }
    return g.startDate === goal.startDate && g.endDate === goal.endDate;
  });
  
  if (existingIndex >= 0) {
    // Mettre à jour l'objectif existant
    goals[existingIndex] = { ...goals[existingIndex], ...newGoal };
  } else {
    // Ajouter un nouvel objectif
    goals.push(newGoal);
  }

  this.storage!.setItem(
    this.getStorageKey(`goals_${goal.period}`), 
    JSON.stringify(goals)
  );
  return newGoal.id!;
}

async updateGoal(
  id: number, 
  period: 'day' | 'week' | 'month' | 'year', 
  updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'period'>>
): Promise<void> {
  if (!browser) throw new Error('Storage not available');

  const goals = await this.getGoals(period);
  const index = goals.findIndex(g => g.id === id);

  if (index !== -1) {
    const updatedGoal = { 
      ...goals[index], 
      ...updates, 
      updatedAt: Date.now() 
    };
    goals[index] = updatedGoal;
    this.storage!.setItem(
      this.getStorageKey(`goals_${period}`), 
      JSON.stringify(goals)
    );
  }
}

private async getGoals(period: 'day' | 'week' | 'month' | 'year'): Promise<Goal[]> {
  if (!browser) return [];
  try {
    const data = this.storage!.getItem(this.getStorageKey(`goals_${period}`));
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error getting ${period} goals:`, error);
    return [];
  }
}
}

// Utiliser la version temporaire avec localStorage
export const db = new PomodoroDatabase();