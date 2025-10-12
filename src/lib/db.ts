import Dexie, { type Table } from 'dexie';

export interface Task {
	id?: number;
	title: string;
	description?: string;
	scheduledDate?: string; // YYYY-MM-DD
	scheduledStartTime?: string; // HH:mm
	scheduledEndTime?: string; // HH:mm
	estimatedMinutes?: number;
	completed: boolean;
	completedAt?: number; // Date à laquelle la tâche a été marquée comme terminée
	tags: string[];
	priority: 'low' | 'medium' | 'high';
	createdAt: number;
	updatedAt: number;
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

export interface TimeLog {
	id?: number;
	taskId?: number;
	startTime: number;
	endTime?: number;
	durationMinutes?: number;
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
		super('RorodoroTodoApp');
		this.version(2).stores({
			tasks: '++id, scheduledDate, completed, createdAt',
			pomodoroSessions: '++id, taskId, startTime, type',
			timeLogs: '++id, taskId, startTime, endTime',
			dailyGoals: '++id, date, createdAt'
		});
	}
}

export const db = new PomodoroDatabase();
