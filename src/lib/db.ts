import Dexie, { type Table } from 'dexie';

export interface Task {
	id?: number;
	title: string;
	description?: string;
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

export class PomodoroDatabase extends Dexie {
	tasks!: Table<Task>;
	pomodoroSessions!: Table<PomodoroSession>;
	timeLogs!: Table<TimeLog>;
	dailyGoals!: Table<DailyGoal>;

	constructor() {
		super('PomodoroTodoApp');
		this.version(1).stores({
			tasks: '++id, completed, createdAt',
			pomodoroSessions: '++id, taskId, startTime, type',
			timeLogs: '++id, taskId, startTime, endTime',
			dailyGoals: '++id, date, createdAt'
		});
	}
}

export const db = new PomodoroDatabase();
