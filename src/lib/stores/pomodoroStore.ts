import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { PomodoroSession } from '$lib/db';

// Fonction pour jouer le son de fin de minuteur
function playEndTimerSound() {
	if (!browser) return;
	
	try {
		const audio = new Audio('/sounds/end-timer.mp3');
		audio.volume = 0.5; // Ajustez le volume selon les besoins
		
		// Gestion des erreurs
		audio.addEventListener('error', (e) => {
			console.error('Erreur lors de la lecture du son de fin de minuteur:', e);
		});
		
		// Lecture du son (toujours joué, indépendamment du paramètre soundEnabled)
		audio.play().catch(error => {
			console.warn('Impossible de lire le son de fin de minuteur:', error);
		});
	} catch (error) {
		console.warn('Erreur lors de la création de l\'audio de fin de minuteur:', error);
	}
}

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
	soundEnabled: boolean; // État du son d'ambiance
}

const initialState: PomodoroStoreState = {
	state: 'idle',
	currentTaskId: null,
	remainingSeconds: 0,
	totalSeconds: 0,
	completedSessions: 0,
	currentSessionId: null,
	config: defaultConfig,
	soundEnabled: true // Son activé par défaut
};

function createPomodoroStore() {
	const { subscribe, set, update } = writable<PomodoroStoreState>(initialState);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let backgroundAudio: HTMLAudioElement | null = null;

function playBackgroundAudio() {
    if (!browser) return;

    try {
        // Vérifier si le son est désactivé
        update(state => {
            if (!state.soundEnabled) {
                stopBackgroundAudio();
                return state;
            }
            return state;
        });

        // Si l'audio est déjà en cours de lecture, ne rien faire
        if (backgroundAudio && !backgroundAudio.paused) return;

        // Si l'audio existe mais est en pause, le reprendre avec fondu
        if (backgroundAudio && backgroundAudio.paused) {
            const targetVolume = 0.3; // Volume cible à 30%
            backgroundAudio.volume = 0; // Commencer le fondu depuis 0
            
            backgroundAudio.play().catch(error => {
                console.warn('🎵 Could not resume background audio:', error);
            });

            // Fade-in progressif sur 1 seconde
            const fadeInSteps = 20;
            const fadeInInterval = 50; // ms
            const volumeIncrement = targetVolume / fadeInSteps;
            let currentStep = 0;

            const fadeInTimer = setInterval(() => {
                currentStep++;
                if (backgroundAudio && currentStep <= fadeInSteps) {
                    backgroundAudio.volume = Math.min(targetVolume, volumeIncrement * currentStep);
                } else {
                    clearInterval(fadeInTimer);
                }
            }, fadeInInterval);

            return;
        }

        // Créer un nouvel élément audio
        backgroundAudio = new Audio('/sounds/loop-audio-focus.mp3');
        const targetVolume = 0.3; // Volume cible à 30%
        backgroundAudio.volume = 0; // Commencer à 0 pour le fade-in
        backgroundAudio.loop = true;

        // Fonction pour gérer le fondu entre les boucles
        const handleFadeBetweenLoops = () => {
            if (!backgroundAudio) return;

            const audio = backgroundAudio;
            const duration = audio.duration;
            const fadeTime = 1.0; // Durée du fondu en secondes
            
            // Vérifier si on est proche de la fin (dans les 2 dernières secondes)
            if (duration - audio.currentTime <= fadeTime) {
                // Commencer le fondu de sortie
                const fadeOutStartVolume = audio.volume;
                const fadeOutSteps = 20;
                const fadeOutInterval = (fadeTime * 1000) / fadeOutSteps;
                
                let currentStep = 0;
                const fadeOutTimer = setInterval(() => {
                    if (!backgroundAudio || backgroundAudio !== audio) {
                        clearInterval(fadeOutTimer);
                        return;
                    }
                    
                    currentStep++;
                    audio.volume = Math.max(0, fadeOutStartVolume * (1 - (currentStep / fadeOutSteps)));
                    
                    if (currentStep >= fadeOutSteps) {
                        clearInterval(fadeOutTimer);
                    }
                }, fadeOutInterval);
            }
        };

        // Détecter la fin de la boucle
        backgroundAudio.addEventListener('timeupdate', handleFadeBetweenLoops);

        // Gérer le début de la nouvelle boucle
        const handleLoop = () => {
            if (!backgroundAudio) return;
            
            // Fade-in progressif sur 1 seconde
            const fadeInSteps = 20;
            const fadeInInterval = 50; // ms
            const volumeIncrement = targetVolume / fadeInSteps;
            let currentStep = 0;

            const fadeInTimer = setInterval(() => {
                if (!backgroundAudio) {
                    clearInterval(fadeInTimer);
                    return;
                }
                
                currentStep++;
                backgroundAudio.volume = Math.min(targetVolume, volumeIncrement * currentStep);
                
                if (currentStep >= fadeInSteps) {
                    clearInterval(fadeInTimer);
                }
            }, fadeInInterval);
        };

        // Écouter l'événement de fin de boucle
        backgroundAudio.addEventListener('seeked', handleLoop);

        // Démarrer la lecture avec un fondu d'entrée
        backgroundAudio.play().then(() => {
            handleLoop();
        }).catch(error => {
            console.warn('🎵 Could not play background audio (autoplay policy):', error);
        });

        // Nettoyage des écouteurs d'événements
        const cleanup = () => {
            if (backgroundAudio) {
                backgroundAudio.removeEventListener('timeupdate', handleFadeBetweenLoops);
                backgroundAudio.removeEventListener('seeked', handleLoop);
                backgroundAudio.removeEventListener('ended', cleanup);
            }
        };

        backgroundAudio.addEventListener('ended', cleanup);

    } catch (error) {
        console.warn('🎵 Error creating background audio:', error);
    }
}

function stopBackgroundAudio() {
    if (backgroundAudio) {
        console.log('🎵 Starting fade-out...');

        // Fade-out progressif sur 1 seconde (20 étapes de 50ms)
        const fadeOutSteps = 20;
        const fadeOutInterval = 50; // ms
        const currentVolume = backgroundAudio.volume;
        const volumeDecrement = currentVolume / fadeOutSteps;
        let currentStep = 0;

        const fadeOutTimer = setInterval(() => {
            currentStep++;
            if (backgroundAudio && currentStep <= fadeOutSteps) {
                backgroundAudio.volume = Math.max(0, currentVolume - (volumeDecrement * currentStep));
            } else {
                clearInterval(fadeOutTimer);
                // Arrêter complètement l'audio après le fade-out
                backgroundAudio?.pause();
                backgroundAudio = null;
                console.log('🎵 Fade-out completed, audio stopped');
            }
        }, fadeOutInterval);
    }
}

function pauseBackgroundAudio() {
    if (backgroundAudio && !backgroundAudio.paused) {
        console.log('🎵 Pausing background audio');
        backgroundAudio.pause();
    }
}

function resumeBackgroundAudio() {
    if (backgroundAudio && backgroundAudio.paused) {
        backgroundAudio.play().catch(error => {
            console.warn('🎵 Could not resume background audio:', error);
        });
        console.log('🎵 Background audio resumed');
    }
}

	// [Le reste des fonctions existantes...]

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

			playBackgroundAudio();
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
			update(state => {
				if (state.state === 'focus' || state.state === 'short-break' || state.state === 'long-break') {
					// Calculer le temps restant avant la pause
					const now = Date.now();
					const elapsed = Math.floor((now - (state.startTime || now)) / 1000);
					const remaining = Math.max(0, state.totalSeconds - elapsed);
					
					return {
						...state,
						state: 'paused' as PomodoroState,
						remainingSeconds: remaining,
						totalSeconds: state.totalSeconds, // Conserver le temps total
						startTime: undefined
					};
				}
				return state;
			});
			stopTick();
			pauseBackgroundAudio();
		},

		resume: () => {
			const now = Date.now();
			let shouldStartTick = false;
			let newState: PomodoroState = 'idle';

			update(state => {
				if (state.state === 'paused') {
					shouldStartTick = state.remainingSeconds > 0;
					
					// Déterminer le nouvel état en fonction du temps restant
					if (state.remainingSeconds > 0) {
						if (state.remainingSeconds === state.totalSeconds) {
							newState = 'focus';
						} else if (state.remainingSeconds <= state.config.shortBreakDuration * 60) {
							newState = 'short-break';
						} else if (state.remainingSeconds <= state.config.longBreakDuration * 60) {
							newState = 'long-break';
						} else {
							newState = 'focus';
						}
					}
					
					// Calculer le nouveau startTime pour reprendre au bon moment
					const elapsedSeconds = state.totalSeconds - state.remainingSeconds;
					const newStartTime = now - (elapsedSeconds * 1000);
					
					console.log('Resuming timer:', {
						remaining: state.remainingSeconds,
						total: state.totalSeconds,
						elapsed: elapsedSeconds,
						newState,
						newStartTime: new Date(newStartTime).toISOString()
					});
					
					return {
						...state,
						state: newState,
						startTime: newStartTime
					};
				}
				return state;
			});

			// Démarrer le timer après la mise à jour de l'état
			setTimeout(() => {
				if (shouldStartTick) {
					console.log('Starting tick from resume');
					startTick();
				}
				resumeBackgroundAudio();
			}, 0);
		},

		stop: async () => {
			stopTick();
			stopBackgroundAudio();

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
			stopBackgroundAudio();
			set({ ...initialState, completedSessions: currentState!.completedSessions });
		},

		reset: () => {
			stopTick();
			stopBackgroundAudio();
			set(initialState);
		},

		toggleSound: () => {
			update(state => {
				const newState = { ...state, soundEnabled: !state.soundEnabled };
				if (!newState.soundEnabled) {
					stopBackgroundAudio();
				} else if (state.state === 'focus') {
					playBackgroundAudio();
				}
				return newState;
			});
		},
		updateConfig: (newConfig: Partial<PomodoroConfig>) => {
			update(state => {
				const updatedConfig = { ...state.config, ...newConfig };
				return { ...state, config: updatedConfig };
			});
		},
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

						// Jouer le son de fin de minuteur
						playEndTimerSound();

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
