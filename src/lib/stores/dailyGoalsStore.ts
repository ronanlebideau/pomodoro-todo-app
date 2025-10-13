import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { DailyGoal } from '$lib/db';

interface DailyGoalsStoreState {
	currentGoals: DailyGoal | null;
	loading: boolean;
	showModal: boolean;
	editingGoalNumber?: 1 | 2 | 3;
}

function createDailyGoalsStore() {
	const { subscribe, set, update } = writable<DailyGoalsStoreState>({
		currentGoals: null,
		loading: true,
		showModal: false
	});

	return {
		subscribe,

		loadTodayGoals: async () => {
			update(state => ({ ...state, loading: true }));
			const today = new Date().toISOString().split('T')[0];

			try {
				const goals = await db.getDailyGoalByDate(today);
				update(state => ({ ...state, currentGoals: goals || null, loading: false }));
			} catch (error) {
				console.error('Error loading today\'s goals:', error);
				update(state => ({ ...state, loading: false }));
			}
		},

		createOrUpdateGoals: async (goal1: string, goal2: string, goal3: string) => {
			const today = new Date().toISOString().split('T')[0];
			const now = Date.now();

			const goalsData = {
				date: today,
				goal1,
				goal2,
				goal3,
				completed1: false,
				completed2: false,
				completed3: false,
				createdAt: now,
				updatedAt: now
			};

			try {
				// Check if goals already exist for today
				const existingGoals = await db.getDailyGoalByDate(today);

				if (existingGoals) {
					// Update existing goals
					await db.updateDailyGoal(existingGoals.id!, {
						...goalsData,
						updatedAt: now
					});
					update(state => ({
						...state,
						currentGoals: { ...existingGoals, ...goalsData, updatedAt: now }
					}));
				} else {
					// Create new goals
					const id = await db.addDailyGoal(goalsData);
					update(state => ({
						...state,
						currentGoals: { ...goalsData, id: id as number }
					}));
				}
			} catch (error) {
				console.error('Error saving goals:', error);
			}
		},

		toggleGoalCompletion: async (goalNumber: 1 | 2 | 3) => {
			const currentState = await new Promise<DailyGoalsStoreState>((resolve) => {
				let state: DailyGoalsStoreState;
				update(s => {
					state = s;
					return s;
				});
				resolve(state!);
			});

			if (!currentState.currentGoals?.id) return;

			const completedField = `completed${goalNumber}` as keyof DailyGoal;
			const currentValue = currentState.currentGoals[completedField] as boolean;

			try {
				await db.updateDailyGoal(currentState.currentGoals.id, {
					[completedField]: !currentValue,
					updatedAt: Date.now()
				});

				update(state => ({
					...state,
					currentGoals: state.currentGoals ? {
						...state.currentGoals,
						[completedField]: !currentValue,
						updatedAt: Date.now()
					} : null
				}));
			} catch (error) {
				console.error('Error updating goal completion:', error);
			}
		},

		showGoalsModal: () => {
			update(state => ({ ...state, showModal: true, editingGoalNumber: undefined }));
		},

		showGoalsModalForGoal: (goalNumber: 1 | 2 | 3) => {
			update(state => ({ ...state, showModal: true, editingGoalNumber: goalNumber }));
		},

		hideGoalsModal: () => {
			update(state => ({ ...state, showModal: false, editingGoalNumber: undefined }));
		},

		isNewDay: (): boolean => {
			if (!browser) return false; // côté serveur: valeur par défaut
			const today = new Date().toISOString().split('T')[0];
			const lastVisit = localStorage.getItem('lastVisitDate');
			return lastVisit !== today;
		},

		setLastVisitDate: () => {
			if (!browser) return; // côté serveur: ne rien faire
			const today = new Date().toISOString().split('T')[0];
			localStorage.setItem('lastVisitDate', today);
		},

		getEditingGoalNumber: (): (1 | 2 | 3) | undefined => {
			let editingGoalNumber: (1 | 2 | 3) | undefined;
			update(state => {
				editingGoalNumber = state.editingGoalNumber;
				return state;
			});
			return editingGoalNumber;
		},

		updateSpecificGoal: async (goalNumber: 1 | 2 | 3, goalText: string) => {
			const currentState = await new Promise<DailyGoalsStoreState>((resolve) => {
				let state: DailyGoalsStoreState;
				update(s => {
					state = s;
					return s;
				});
				resolve(state!);
			});

			if (!currentState.currentGoals?.id) {
				// If no goals exist, create them first
				const today = new Date().toISOString().split('T')[0];
				const now = Date.now();

				const goalsData = {
					date: today,
					goal1: goalNumber === 1 ? goalText : '',
					goal2: goalNumber === 2 ? goalText : '',
					goal3: goalNumber === 3 ? goalText : '',
					completed1: false,
					completed2: false,
					completed3: false,
					createdAt: now,
					updatedAt: now
				};

				const id = await db.addDailyGoal(goalsData);
				update(state => ({
					...state,
					currentGoals: { ...goalsData, id: id as number }
				}));
			} else {
				// Update existing goals
				const goalField = `goal${goalNumber}` as keyof DailyGoal;
				await db.updateDailyGoal(currentState.currentGoals.id, {
					[goalField]: goalText,
					updatedAt: Date.now()
				});

				update(state => ({
					...state,
					currentGoals: state.currentGoals ? {
						...state.currentGoals,
						[goalField]: goalText,
						updatedAt: Date.now()
					} : null
				}));
			}
		}
	};
}

export const dailyGoalsStore = createDailyGoalsStore();
