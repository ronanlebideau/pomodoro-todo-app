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
	taskId: number;
	startTime: number;
	endTime?: number;
	durationMinutes?: number;
	sessionId?: number; // Link to PomodoroSession if created during Pomodoro
	manual: boolean; // true if manually started, false if from Pomodoro
}

export class PomodoroDatabase extends Dexie {
	tasks!: Table<Task>;
	pomodoroSessions!: Table<PomodoroSession>;
	timeLogs!: Table<TimeLog>;

	constructor() {
		super('PomodoroTodoApp');
		this.version(1).stores({
			tasks: '++id, completed, createdAt',
			pomodoroSessions: '++id, taskId, startTime, type',
			timeLogs: '++id, taskId, startTime, endTime'
		});
	}
}

export const db = new PomodoroDatabase();
