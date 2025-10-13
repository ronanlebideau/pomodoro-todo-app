import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
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
	startTime?: number; // Heure de départ du timer actuel
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
	let intervalId: ReturnType<typeof setInterval> | null = null;

	return {
		subscribe,
		
		startFocus: async (taskId: number | null = null) => {
			const now = Date.now();
			update(state => {
				const duration = state.config.focusDuration * 60;
				return {
					...state,
					state: 'focus' as PomodoroState,
					currentTaskId: taskId,
					remainingSeconds: duration,
					totalSeconds: duration,
					startTime: now
				};
			});

			try {
				const session: PomodoroSession = {
					taskId: taskId ?? undefined,
					type: 'focus',
					durationMinutes: defaultConfig.focusDuration,
					startTime: now,
					completed: false,
					interrupted: false
				};
				const sessionId = await db.addPomodoroSession(session);
				update(state => ({ ...state, currentSessionId: sessionId as number }));
			} catch (error) {
				console.error('Erreur création session DB:', error);
			}

			startTick();
		},

		startBreak: async (isLong: boolean = false) => {
			const now = Date.now();
			update(state => {
				const duration = isLong
					? state.config.longBreakDuration * 60
					: state.config.shortBreakDuration * 60;
				return {
					...state,
					state: isLong ? 'long-break' as PomodoroState : 'short-break' as PomodoroState,
					remainingSeconds: duration,
					totalSeconds: duration,
					startTime: now
				};
			});

			try {
				const session: PomodoroSession = {
					type: isLong ? 'long-break' : 'short-break',
					durationMinutes: isLong ? defaultConfig.longBreakDuration : defaultConfig.shortBreakDuration,
					startTime: now,
					completed: false,
					interrupted: false
				};
				const sessionId = await db.addPomodoroSession(session);
				update(state => ({ ...state, currentSessionId: sessionId as number }));
			} catch (error) {
				console.error('Erreur création session DB:', error);
			}

			startTick();
		},

		pause: () => {
			update(state => ({
				...state,
				state: 'paused' as PomodoroState,
				startTime: undefined
			}));
			stopTick();
		},

		resume: () => {
			const now = Date.now();
			update(state => {
				if (state.state === 'paused') {
					return {
						...state,
						state: state.remainingSeconds > 0 ? 'focus' as PomodoroState : 'idle' as PomodoroState,
						startTime: now
					};
				}
				return state;
			});
			startTick();
		},

		stop: async () => {
			stopTick();

			try {
				let currentState: PomodoroStoreState;
				update(state => {
					currentState = state;
					return state;
				});

				if (currentState!.currentSessionId) {
					await db.updatePomodoroSession(currentState!.currentSessionId, {
						interrupted: true,
						endTime: Date.now()
					});
				}
			} catch (error) {
				console.error('Erreur mise à jour session DB:', error);
			}

			set(initialState);
		},

		completeSession: async () => {
			let currentState: PomodoroStoreState;
			update(state => {
				currentState = state;
				return state;
			});

			try {
				if (currentState!.currentSessionId) {
					await db.updatePomodoroSession(currentState!.currentSessionId, {
						completed: true,
						endTime: Date.now()
					});
				}

				if (currentState!.state === 'focus') {
					update(state => ({
						...state,
						completedSessions: state.completedSessions + 1
					}));
				}
			} catch (error) {
				console.error('Erreur mise à jour session DB:', error);
			}

			stopTick();
			set({ ...initialState, completedSessions: currentState!.completedSessions });
		},

		updateConfig: (config: Partial<PomodoroConfig>) => {
			update(state => ({
				...state,
				config: { ...state.config, ...config }
			}));
		},

		reset: () => {
			stopTick();
			set(initialState);
		}
	};

	function startTick() {
		if (intervalId) return;

		// Premier tick immédiat pour démarrer le timer sans délai
		update(state => {
			if (state.startTime && (state.state === 'focus' || state.state === 'short-break' || state.state === 'long-break')) {
				const now = Date.now();
				const elapsedSeconds = Math.floor((now - state.startTime) / 1000);
				const remaining = Math.max(0, state.totalSeconds - elapsedSeconds);
				return { ...state, remainingSeconds: remaining };
			}
			return state;
		});

		// Puis démarrer l'intervalle normal
		intervalId = setInterval(() => {
			update(state => {
				if (state.startTime && (state.state === 'focus' || state.state === 'short-break' || state.state === 'long-break')) {
					const now = Date.now();
					const elapsedSeconds = Math.floor((now - state.startTime) / 1000);
					const remaining = Math.max(0, state.totalSeconds - elapsedSeconds);

					if (remaining <= 0) {
						stopTick();

						if (browser && 'Notification' in globalThis && Notification.permission === 'granted') {
							new Notification('Pomodoro terminé !', {
								body: state.state === 'focus'
									? 'Temps de faire une pause !'
									: 'Prêt à reprendre le travail ?',
								icon: '/favicon.png'
							});
						}

						pomodoroStore.completeSession();
						return { ...state, remainingSeconds: 0, state: 'idle' as PomodoroState };
					}

					return { ...state, remainingSeconds: remaining };
				}

				return state;
			});
		}, 1000);
	}

	function stopTick() {
		if (intervalId) {
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
