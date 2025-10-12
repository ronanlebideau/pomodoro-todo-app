import { writable, derived } from 'svelte/store';
import { db } from '$lib/db';
import type { PomodoroSession } from '$lib/db';

export type PomodoroState = 'idle' | 'focus' | 'short-break' | 'long-break' | 'paused';

export interface PomodoroConfig {
	focusDuration: number; // 25 minutes
	shortBreakDuration: number; // 5 minutes
	longBreakDuration: number; // 15 minutes
	sessionsBeforeLongBreak: number; // 4
}

export const defaultConfig: PomodoroConfig = {
	focusDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	sessionsBeforeLongBreak: 4
};

interface PomodoroStoreState {
	state: PomodoroState;
	currentTaskId: number | null;
	remainingSeconds: number;
	totalSeconds: number;
	completedSessions: number;
	currentSessionId: number | null;
	config: PomodoroConfig;
}

const initialState: PomodoroStoreState = {
	state: 'idle',
	currentTaskId: null,
	remainingSeconds: 0,
	totalSeconds: 0,
	completedSessions: 0,
	currentSessionId: null,
	config: defaultConfig
};

function createPomodoroStore() {
	const { subscribe, set, update } = writable<PomodoroStoreState>(initialState);
	let intervalId: number | null = null;

	return {
		subscribe,
		
		startFocus: async (taskId: number | null = null) => {
			update(state => {
				const duration = state.config.focusDuration * 60;
				return {
					...state,
					state: 'focus',
					currentTaskId: taskId,
					remainingSeconds: duration,
					totalSeconds: duration
				};
			});
			
			// Create session in DB
			const session: PomodoroSession = {
				taskId: taskId ?? undefined,
				type: 'focus',
				durationMinutes: defaultConfig.focusDuration,
				startTime: Date.now(),
				completed: false,
				interrupted: false
			};
			const sessionId = await db.pomodoroSessions.add(session);
			update(state => ({ ...state, currentSessionId: sessionId as number }));
			
			startTimer();
		},

		startBreak: async (isLong: boolean = false) => {
			update(state => {
				const duration = isLong 
					? state.config.longBreakDuration * 60 
					: state.config.shortBreakDuration * 60;
				return {
					...state,
					state: isLong ? 'long-break' : 'short-break',
					remainingSeconds: duration,
					totalSeconds: duration
				};
			});

			// Create break session in DB
			let currentState: PomodoroStoreState;
			update(state => {
				currentState = state;
				return state;
			});
			
			const session: PomodoroSession = {
				type: isLong ? 'long-break' : 'short-break',
				durationMinutes: isLong ? defaultConfig.longBreakDuration : defaultConfig.shortBreakDuration,
				startTime: Date.now(),
				completed: false,
				interrupted: false
			};
			const sessionId = await db.pomodoroSessions.add(session);
			update(state => ({ ...state, currentSessionId: sessionId as number }));

			startTimer();
		},

		pause: () => {
			stopTimer();
			update(state => ({ ...state, state: 'paused' }));
		},

		resume: () => {
			update(state => {
				if (state.state === 'paused') {
					return { ...state, state: state.remainingSeconds > 0 ? 'focus' : 'idle' };
				}
				return state;
			});
			startTimer();
		},

		stop: async () => {
			stopTimer();
			
			// Mark current session as interrupted
			let currentState: PomodoroStoreState;
			update(state => {
				currentState = state;
				return state;
			});
			
			if (currentState!.currentSessionId) {
				await db.pomodoroSessions.update(currentState!.currentSessionId, {
					interrupted: true,
					endTime: Date.now()
				});
			}

			set(initialState);
		},

		completeSession: async () => {
			let currentState: PomodoroStoreState;
			update(state => {
				currentState = state;
				return state;
			});

			// Mark session as completed
			if (currentState!.currentSessionId) {
				await db.pomodoroSessions.update(currentState!.currentSessionId, {
					completed: true,
					endTime: Date.now()
				});
			}

			// Increment completed sessions if it was a focus session
			if (currentState!.state === 'focus') {
				update(state => ({ 
					...state, 
					completedSessions: state.completedSessions + 1 
				}));
			}

			stopTimer();
			set({ ...initialState, completedSessions: currentState!.completedSessions });
		},

		updateConfig: (config: Partial<PomodoroConfig>) => {
			update(state => ({
				...state,
				config: { ...state.config, ...config }
			}));
		},

		reset: () => {
			stopTimer();
			set(initialState);
		}
	};

	function startTimer() {
		if (intervalId !== null) return;

		intervalId = window.setInterval(() => {
			update(state => {
				if (state.remainingSeconds <= 0) {
					// Timer finished
					stopTimer();
					pomodoroStore.completeSession();
					
					// Show notification
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification('Pomodoro terminé !', {
							body: state.state === 'focus' 
								? 'Temps de faire une pause !' 
								: 'Prêt à reprendre le travail ?',
							icon: '/favicon.png'
						});
					}
					
					return state;
				}

				return {
					...state,
					remainingSeconds: state.remainingSeconds - 1
				};
			});
		}, 1000);
	}

	function stopTimer() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}
}

export const pomodoroStore = createPomodoroStore();

export const pomodoroProgress = derived(pomodoroStore, $store => {
	if ($store.totalSeconds === 0) return 0;
	return (($store.totalSeconds - $store.remainingSeconds) / $store.totalSeconds) * 100;
});

export const formattedTime = derived(pomodoroStore, $store => {
	const minutes = Math.floor($store.remainingSeconds / 60);
	const seconds = $store.remainingSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});
