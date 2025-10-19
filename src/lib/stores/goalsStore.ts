import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db';
import type { Goal } from '$lib/db';
import { playSound } from '$lib/utils/sounds';

export type GoalPeriod = 'day' | 'week' | 'month' | 'year';

interface GoalsStoreState {
  currentGoals: {
    day: Goal | null;
    week: Goal | null;
    month: Goal | null;
    year: Goal | null;
  };
  loading: boolean;
  showModal: boolean;
  activePeriod: GoalPeriod;
  editingGoalNumber?: 1 | 2 | 3;
}

interface GoalsStore {
  subscribe: (run: (value: GoalsStoreState) => void) => () => void;
  setActivePeriod: (period: GoalPeriod) => void;
  loadGoals: (date?: Date) => Promise<void>;
  toggleGoalCompletion: (period: GoalPeriod, goalNumber: 1 | 2 | 3) => Promise<void>;
  showGoalsModal: (period: GoalPeriod, goalNumber?: 1 | 2 | 3) => void;
  hideGoalsModal: () => void;
  saveGoals: (period: GoalPeriod, goals: { goal1: string; goal2: string; goal3: string }) => Promise<void>;
}

function createGoalsStore(): GoalsStore {
  const { subscribe, set, update } = writable<GoalsStoreState>({
    currentGoals: {
      day: null,
      week: null,
      month: null,
      year: null
    },
    loading: true,
    showModal: false,
    activePeriod: 'day'
  });

  const self: GoalsStore = {
    subscribe,
    setActivePeriod: () => {},
    loadGoals: async () => {},
    toggleGoalCompletion: async () => {},
    showGoalsModal: () => {},
    hideGoalsModal: () => {},
    saveGoals: async () => {}
  };

  async function createDefaultGoal(period: GoalPeriod, date: Date): Promise<Goal> {
    const now = new Date();
    const baseGoal = {
      date: now.toISOString().split('T')[0],
      period,
      goal1: '',
      goal2: '',
      goal3: '',
      completed1: false,
      completed2: false,
      completed3: false,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };

    if (period === 'day') {
      return { ...baseGoal, period: 'day' };
    }

    // Calculer les dates de début et de fin pour les périodes plus longues
    const startDate = new Date(date);
    const endDate = new Date(date);

    if (period === 'week') {
      // Premier jour de la semaine (lundi)
      const day = date.getDay() || 7; // Convertit dimanche (0) en 7
      startDate.setDate(date.getDate() - (day - 1));
      endDate.setDate(startDate.getDate() + 6);
    } else if (period === 'month') {
      startDate.setDate(1);
      endDate.setMonth(date.getMonth() + 1, 0); // Dernier jour du mois
    } else if (period === 'year') {
      startDate.setMonth(0, 1); // 1er janvier
      endDate.setMonth(11, 31); // 31 décembre
    }

    return {
      ...baseGoal,
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  self.setActivePeriod = (period: GoalPeriod) => {
    update(state => ({ ...state, activePeriod: period }));
  };

  self.loadGoals = async (date: Date = new Date()) => {
    let currentState: GoalsStoreState;
    update(state => {
      currentState = state;
      return { ...state, loading: true };
    });
    
    const dateStr = date.toISOString().split('T')[0];
    const activePeriod = currentState!.activePeriod;

    try {
      // Charger uniquement les objectifs de la période active
      const loadGoal = async (period: GoalPeriod) => {
        if (period === activePeriod) {
          return await db.getGoalByDate(period, dateStr) || createDefaultGoal(period, date);
        }
        return currentState!.currentGoals[period];
      };

      const [day, week, month, year] = await Promise.all([
        loadGoal('day'),
        loadGoal('week'),
        loadGoal('month'),
        loadGoal('year')
      ]);

      update(state => ({
        ...state,
        currentGoals: { day, week, month, year },
        loading: false
      }));
    } catch (error) {
      console.error('Error loading goals:', error);
      update(state => ({
        ...state,
        loading: false
      }));
    }
  };

  self.toggleGoalCompletion = async (period: GoalPeriod, goalNumber: 1 | 2 | 3) => {
    console.log('=== toggleGoalCompletion START ===');
    console.log('Period:', period, 'Goal number:', goalNumber);
    
    try {
      // Obtenir l'état actuel
      let currentState: GoalsStoreState;
      update(state => {
        currentState = state;
        return state;
      });
      
      const currentGoals = currentState!.currentGoals[period];
      console.log('Current goals before update:', currentGoals);
      
      if (!currentGoals) {
        console.error('No current goals for period', period);
        return;
      }

      const completedField = `completed${goalNumber}` as const;
      const currentStatus = currentGoals[completedField];
      const newStatus = !currentStatus;
      
      console.log(`Toggling ${completedField} from ${currentStatus} to ${newStatus}`);
      
      // Créer une copie profonde de l'objet pour forcer la réactivité
      const updatedGoals = JSON.parse(JSON.stringify({
        ...currentGoals,
        [completedField]: newStatus,
        updatedAt: Date.now()
      }));

      console.log('Updated goals object:', updatedGoals);

      // Mettre à jour l'état localement
      update(state => {
        console.log('Updating store state...');
        const newState = {
          ...state,
          currentGoals: {
            ...state.currentGoals,
            [period]: updatedGoals
          }
        };
        console.log('New state:', newState);
        return newState;
      });

      // Mettre à jour la base de données en arrière-plan
      try {
        console.log('Updating database...');
        await db.updateGoal(currentGoals.id!, period, {
          [completedField]: newStatus,
          updatedAt: Date.now()
        });
        console.log('Database update successful');
        
        // Jouer le son de confirmation uniquement lors de la coche (et non du décocher)
        if (newStatus === true) {
          playSound('dailygoal-complete.mp3', 0.3);
        }
        
        // Recharger les objectifs pour s'assurer que tout est synchronisé
        await self.loadGoals();
      } catch (error) {
        console.error('Error updating goal in database:', error);
        // En cas d'erreur, annuler le changement local
        update(state => ({
          ...state,
          currentGoals: {
            ...state.currentGoals,
            [period]: currentGoals // Restaurer l'ancien état
          }
        }));
      }
    } catch (error) {
      console.error('Error in toggleGoalCompletion:', error);
    } finally {
      console.log('=== toggleGoalCompletion END ===');
    }
  };

  self.showGoalsModal = (period: GoalPeriod, goalNumber?: 1 | 2 | 3) => {
    update(state => ({
      ...state,
      showModal: true,
      activePeriod: period,
      editingGoalNumber: goalNumber
    }));
  };

  self.hideGoalsModal = () => {
    update(state => ({ ...state, showModal: false, editingGoalNumber: undefined }));
  };

  self.saveGoals = async (period: GoalPeriod, goals: { goal1: string; goal2: string; goal3: string }) => {
    update(state => ({ ...state, loading: true }));

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const currentGoals = await db.getGoalByDate(period, dateStr);
      
      if (currentGoals) {
        // Mettre à jour l'objectif existant avec les nouveaux textes
        await db.updateGoal(currentGoals.id!, period, {
          ...goals,
          // Préserver les états existants des objectifs complétés
          completed1: currentGoals.completed1,
          completed2: currentGoals.completed2,
          completed3: currentGoals.completed3,
          updatedAt: now.getTime()
        });
      } else {
        // Créer un nouvel objectif avec les valeurs par défaut
        const newGoal = {
          ...goals,
          period,
          date: dateStr,
          completed1: false,
          completed2: false,
          completed3: false,
          createdAt: now.getTime(),
          updatedAt: now.getTime()
        };
        await db.addGoal(newGoal);
      }

      // Recharger les objectifs
      await self.loadGoals();
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      update(state => ({ ...state, loading: false, showModal: false }));
    }
  };

  return self;
}

export const goalsStore = createGoalsStore();