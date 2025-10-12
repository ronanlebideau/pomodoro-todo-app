import { writable, derived } from 'svelte/store';
import { db } from '$lib/db';

// Types
type PomodoroState = 'idle' | 'focus' | 'short-break' | 'long-break' | 'paused';

interface PomodoroConfig {
	focusDuration: number;
	shortBreakDuration: number;
	longBreakDuration: number;
	sessionsBeforeLongBreak: number;
	autoStartBreaks: boolean;
	autoStartPomodoros: boolean;
	notificationSound: boolean;
	tickSound: boolean;
}

interface PomodoroSession {
	taskId?: number;
	type: 'focus' | 'short-break' | 'long-break';
	durationMinutes: number;
	startTime: number;
	endTime?: number;
	completed: boolean;
	interrupted: boolean;
}

const defaultConfig: PomodoroConfig = {
	focusDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	sessionsBeforeLongBreak: 4,
	autoStartBreaks: false,
	autoStartPomodoros: false,
	notificationSound: true,
	tickSound: false
};

interface PomodoroStoreState {
	state: PomodoroState;
	currentTaskId: number | null;
	remainingSeconds: number;
	totalSeconds: number;
	completedSessions: number;
	currentSessionId: number | null;
	config: PomodoroConfig;
	startTime: number | null;
	isTabVisible: boolean;
	showNotificationModal: boolean;
	notificationSound: boolean;
	customDuration?: number | null;

	// Ajout pour un resume correct
	stateBeforePause?: PomodoroState;
}

const initialState: PomodoroStoreState = {
	state: 'idle',
	currentTaskId: null,
	remainingSeconds: 0,
	totalSeconds: 0,
	completedSessions: 0,
	currentSessionId: null,
	config: defaultConfig,
	startTime: null,
	isTabVisible: typeof window !== 'undefined' && typeof document !== 'undefined' ? !document.hidden : true,
	showNotificationModal: false,
	notificationSound: false,
	customDuration: null,
	stateBeforePause: undefined
};

function createPomodoroStore() {
	const { subscribe, set, update } = writable<PomodoroStoreState>(initialState);
	let intervalId: number | null = null;

	// Garder un miroir local de l'état pour lecture sans update
	let current: PomodoroStoreState = initialState;
	subscribe((v) => (current = v));

	// Pour fermer proprement le son
	let audioContext: AudioContext | null = null;
	let oscillator: OscillatorNode | null = null;

	// Request notification permission
	function requestNotificationPermission() {
		// Only run in browser environment and check for Notification API
		if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && 'Notification' in window) {
			try {
				if (Notification.permission === 'default') {
					Notification.requestPermission().catch(() => {});
				}
			} catch (e) {
				// Silently fail if Notification API is not available
			}
		}
	}

	// Play notification sound (beep court)
	function playNotificationSound() {
		if (typeof window === 'undefined') return;

		try {
			// Stop any existing sound
			if ((window as any).__pomodoroSoundControl) {
				(window as any).__pomodoroSoundControl.stop();
			}

			// Check if AudioContext is available
			if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
				return;
			}

			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			audioContext = new AudioContextClass();
			oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
			oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.1);

			(window as any).__pomodoroSoundControl = {
				stop: () => {
					try {
						if (oscillator) oscillator.stop();
					} catch {}
					if (audioContext) {
						// fermer l'audio context proprement
						audioContext.close().catch(() => {});
					}
					audioContext = null;
					oscillator = null;
				}
			};

			// Fermer au bout de ~150ms par sécurité
			setTimeout(() => {
				if ((window as any).__pomodoroSoundControl) {
					(window as any).__pomodoroSoundControl.stop();
					delete (window as any).__pomodoroSoundControl;
				}
			}, 200);
		} catch (error) {
			// Silently fail if audio APIs are not available
			console.warn('Could not play notification sound:', error);
		}
	}

	// Stop notification sound and hide modal
	function stopNotification() {
		if (typeof window !== 'undefined' && (window as any).__pomodoroSoundControl) {
			(window as any).__pomodoroSoundControl.stop();
			delete (window as any).__pomodoroSoundControl;
		}
		update((state) => ({
			...state,
			showNotificationModal: false
		}));
	}

	// Helpers
	function getCurrent<T>(picker: (s: PomodoroStoreState) => T): T {
		// utilise le miroir 'current' pour éviter un update "lecture"
		return picker(current);
	}

	async function createSession(
		type: PomodoroSession['type'],
		durationSec: number,
		taskId?: number
	) {
		try {
			const session: PomodoroSession = {
				taskId,
				type,
				durationMinutes: Math.round(durationSec / 60),
				startTime: Date.now(),
				completed: false,
				interrupted: false
			};
			const sessionId = await db.pomodoroSessions.add(session);
			update((s) => ({ ...s, currentSessionId: sessionId as number }));
		} catch (e) {
			console.error('Failed to create session:', e);
			// on ne bloque pas l'UI si la DB échoue
			update((s) => ({ ...s, currentSessionId: null }));
		}
	}

	function startPhase(nextState: Exclude<PomodoroState, 'paused' | 'idle'>, durationSec: number, taskId?: number) {
		stopNotification();
		requestNotificationPermission();
		const now = Date.now();
		update((s) => ({
			...s,
			state: nextState,
			currentTaskId: taskId ?? s.currentTaskId,
			remainingSeconds: durationSec,
			totalSeconds: durationSec,
			startTime: now,
			showNotificationModal: false,
			stateBeforePause: undefined
		}));
		startTimer();
	}

	async function onPhaseFinished() {
		// Marquer la session en DB
		const s = getCurrent((x) => x);
		if (s.currentSessionId) {
			try {
				await db.pomodoroSessions.update(s.currentSessionId, {
					completed: true,
					endTime: Date.now()
				});
			} catch (e) {
				console.error('Failed to update session as completed:', e);
			}
		}

		const wasFocus = s.state === 'focus';
		const completed = wasFocus ? s.completedSessions + 1 : s.completedSessions;

		// Auto-start break après focus ?
		if (wasFocus && s.config.autoStartBreaks) {
			const longBreak = (completed % s.config.sessionsBeforeLongBreak) === 0;
			const dur = (longBreak ? s.config.longBreakDuration : s.config.shortBreakDuration) * 60;
			update((x) => ({ ...x, completedSessions: completed }));
			startPhase(longBreak ? 'long-break' : 'short-break', dur);
			await createSession(longBreak ? 'long-break' : 'short-break', dur);
			return;
		}

		// Auto-start focus après break ?
		if (!wasFocus && s.config.autoStartPomodoros) {
			const dur = s.config.focusDuration * 60;
			update((x) => ({ ...x, completedSessions: completed }));
			startPhase('focus', dur, s.currentTaskId ?? undefined);
			await createSession('focus', dur, s.currentTaskId ?? undefined);
			return;
		}

		// Pas d'auto-start → notif + idle
		update((x) => ({
			...x,
			completedSessions: completed,
			showNotificationModal: true,
			state: 'idle',
			remainingSeconds: 0,
			startTime: null,
			// on peut aussi nettoyer currentSessionId si tu préfères
			// currentSessionId: null
		}));

		if (s.config.notificationSound) {
			playNotificationSound();
		}
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
			new Notification('Pomodoro terminé !', {
				body: wasFocus ? 'Temps de faire une pause !' : 'Prêt à reprendre le travail ?',
				requireInteraction: true
			});
		}
	}

	function startTimer() {
		if (intervalId !== null) return;
		if (typeof window === 'undefined') return;

		intervalId = window.setInterval(() => {
			let finished = false;

			update((state) => {
				if (state.state === 'idle' || state.state === 'paused' || !state.startTime) {
					return state; // ✅ always return
				}

				const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
				const newRemainingSeconds = Math.max(0, state.totalSeconds - elapsedSeconds);

				if (newRemainingSeconds <= 0) {
					// Fin de phase
					stopTimer();
					finished = true;
					// on renvoie un état cohérent immédiatement
					return { ...state, remainingSeconds: 0 };
				}

				return { ...state, remainingSeconds: newRemainingSeconds };
			});

			if (finished) {
				// faire l'async en-dehors du callback update
				onPhaseFinished().catch(console.error);
			}
		}, 1000);
	}

	function stopTimer() {
		if (intervalId !== null && typeof window !== 'undefined') {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	return {
		subscribe,

		startFocus: async (taskId: number | null = null, customDurationSeconds?: number) => {
			// calcule la durée réelle (custom > config)
			const durationSec = customDurationSeconds ?? getCurrent((s) => s.config.focusDuration * 60);
			startPhase('focus', durationSec, taskId ?? undefined);
			await createSession('focus', durationSec, taskId ?? undefined);
		},

		startBreak: async (isLong: boolean = false) => {
			const durationSec = getCurrent(
				(s) => (isLong ? s.config.longBreakDuration : s.config.shortBreakDuration) * 60
			);
			startPhase(isLong ? 'long-break' : 'short-break', durationSec);
			await createSession(isLong ? 'long-break' : 'short-break', durationSec);
		},

		pause: () => {
			stopTimer();
			update((s) => ({ ...s, stateBeforePause: s.state, state: 'paused' }));
		},

		resume: () => {
			update((s) => {
				if (s.state !== 'paused') return s;

				// recalculer startTime pour repartir de remainingSeconds
				const now = Date.now();
				const elapsedAlready = s.totalSeconds - s.remainingSeconds; // en secondes
				return {
					...s,
					state: s.remainingSeconds > 0 ? (s.stateBeforePause ?? 'focus') : 'idle',
					startTime: now - elapsedAlready * 1000,
					stateBeforePause: undefined
				};
			});
			startTimer();
		},

		stop: async () => {
			stopTimer();

			// Snapshot avant reset
			const snapshot = getCurrent((s) => s);

			// Mark current session as interrupted
			if (snapshot.currentSessionId) {
				try {
					await db.pomodoroSessions.update(snapshot.currentSessionId, {
						interrupted: true,
						endTime: Date.now()
					});
				} catch (e) {
					console.error('Failed to mark session as interrupted:', e);
				}
			}

			// Préserver la config et isTabVisible
			set({
				...initialState,
				config: snapshot.config,
				isTabVisible: snapshot.isTabVisible
			});
		},

		completeSession: async () => {
			const snapshot = getCurrent((s) => s);

			// Mark session as completed
			if (snapshot.currentSessionId) {
				try {
					await db.pomodoroSessions.update(snapshot.currentSessionId, {
						completed: true,
						endTime: Date.now()
					});
				} catch (e) {
					console.error('Failed to mark session as completed:', e);
				}
			}

			const newCompleted = snapshot.state === 'focus' ? snapshot.completedSessions + 1 : snapshot.completedSessions;
			stopTimer();

			set({
				...initialState,
				config: snapshot.config,
				isTabVisible: snapshot.isTabVisible,
				completedSessions: newCompleted
			});
		},

		stopNotification,

		reset: () => {
			stopTimer();
			stopNotification();
			const snapshot = getCurrent((s) => s);
			set({
				...initialState,
				config: snapshot.config,
				isTabVisible: snapshot.isTabVisible
			});
		}
	};
}

export const pomodoroStore = createPomodoroStore();

export const pomodoroProgress = derived(pomodoroStore, ($store) => {
	if ($store.totalSeconds === 0) return 0;
	return (($store.totalSeconds - $store.remainingSeconds) / $store.totalSeconds) * 100;
});

export const formattedTime = derived(pomodoroStore, ($store) => {
	// When idle, show the configured focus duration
	if ($store.state === 'idle') {
		// si tu veux afficher une durée custom potentielle, remplace par:
		// const minutes = $store.customDuration ? Math.floor($store.customDuration / 60) : $store.config.focusDuration;
		const minutes = $store.config.focusDuration;
		const seconds = 0;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	// During active sessions, show remaining time
	const minutes = Math.floor($store.remainingSeconds / 60);
	const seconds = $store.remainingSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});