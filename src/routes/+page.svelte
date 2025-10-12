 <script lang="ts">
  import { onMount } from 'svelte';
  import { taskStore } from '$lib/stores/taskStore';
  import { pomodoroStore } from '$lib/stores/pomodoroStore';
  import { dailyGoalsStore } from '$lib/stores/dailyGoalsStore';
  import PomodoroTimer from '$lib/components/PomodoroTimer.svelte';
  import TaskForm from '$lib/components/TaskForm.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import DayTimeline from '$lib/components/DayTimeline.svelte';
  import StatsPanel from '$lib/components/StatsPanel.svelte';
  import WeekCalendar from '$lib/components/WeekCalendar.svelte';
  import NotificationModal from '$lib/components/NotificationModal.svelte';
  import DailyGoalsModal from '$lib/components/DailyGoalsModal.svelte';
  import DailyGoalsDisplay from '$lib/components/DailyGoalsDisplay.svelte';
  import { Plus, Calendar, BarChart3, CheckSquare } from 'lucide-svelte';
  import type { Task } from '$lib/db';

  let showTaskForm = $state(false);
  let editingTask: Task | null = $state(null);
  let activeTab: 'tasks' | 'timeline' | 'stats' = $state('tasks');
  let selectedDate = $state(new Date().toISOString().split('T')[0]);
  let timelineView: 'day' | 'week' = $state('day');
  let isMac = $state(false);
  let loading = $state(true);

  onMount(async () => {
    try {
      await taskStore.loadTasks();
      await dailyGoalsStore.loadTodayGoals();

      // Set isMac after mounting to avoid SSR issues
      if (typeof navigator !== 'undefined') {
        isMac = navigator.platform?.toUpperCase().indexOf('MAC') >= 0 || false;
      }

      // Check if it's a new day and we need to show the goals modal
      if (dailyGoalsStore.isNewDay()) {
        dailyGoalsStore.subscribe((state: any) => {
          if (!state.currentGoals && !state.showModal) {
            dailyGoalsStore.showGoalsModal();
          }
        });
      }

      loading = false;
    } catch (error) {
      console.error('Error initializing app:', error);
      loading = false;
    }
  });

  function handleCloseForm() {
    editingTask = null;
    showTaskForm = false;
  }

  function handleNewTask() {
    editingTask = null;
    showTaskForm = true;
  }

  function handleEditTask(task: Task) {
    editingTask = task;
    showTaskForm = true;
  }

  function handleStartPomodoro(taskId: number) {
    pomodoroStore.stopNotification();
    if ($pomodoroStore.state !== 'idle') {
      pomodoroStore.stop();
    }
    pomodoroStore.startFocus(taskId);
  }

  function handlePausePomodoro() {
    pomodoroStore.pause();
  }
</script>

<svelte:head>
  <title>Rorodoro Todo - Neo Dashboard</title>
  <meta name="description" content="Modern Pomodoro Todo App with Neo-Minimalist Design" />
</svelte:head>

{#if loading}
  <div class="h-screen w-full bg-neutral-900 text-white flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
      <p class="text-white/60">Chargement...</p>
    </div>
  </div>
{:else}
  <!-- Minimalist Full-Screen Layout -->
  <div class="h-screen w-full bg-neutral-900 text-white flex">
    <!-- Left Panel: Timer & Controls -->
    <div class="w-1/3 bg-neutral-800 border-r border-neutral-700 flex flex-col">
      <!-- Timer Section -->
      <div class="flex-1 flex items-center justify-center p-8">
        <PomodoroTimer />
      </div>
    </div>

    <!-- Right Panel: Tasks & Content -->
    <div class="flex-1 flex flex-col bg-neutral-900">
      <!-- Header -->
      <div class="border-b border-neutral-700 p-6">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-medium text-white">Rorodoro Todo</h1>
          <button
            onclick={handleNewTask}
            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Nouvelle tâche
          </button>
        </div>
      </div>

      <!-- Daily Goals Display -->
      <DailyGoalsDisplay />

      <!-- Tab Navigation -->
      <div class="border-b border-neutral-700">
        <div class="flex">
          <button
            onclick={() => activeTab = 'tasks'}
            class="px-6 py-4 text-sm font-medium transition-colors {activeTab === 'tasks' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400 hover:text-white'}"
          >
            Tâches
          </button>
          <button
            onclick={() => activeTab = 'timeline'}
            class="px-6 py-4 text-sm font-medium transition-colors {activeTab === 'timeline' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400 hover:text-white'}"
          >
            Planning
          </button>
          <button
            onclick={() => activeTab = 'stats'}
            class="px-6 py-4 text-sm font-medium transition-colors {activeTab === 'stats' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400 hover:text-white'}"
          >
            Statistiques
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden">
        {#if activeTab === 'tasks'}
          <TaskList
            onEditTask={handleEditTask}
            onStartPomodoro={handleStartPomodoro}
            onPausePomodoro={handlePausePomodoro}
            isTimerRunning={$pomodoroStore.state === 'focus' || $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break'}
            currentTaskId={$pomodoroStore.currentTaskId}
          />
        {:else if activeTab === 'timeline'}
          <div class="h-full flex flex-col">
            <div class="p-6 border-b border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <button
                    onclick={() => timelineView = 'day'}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {timelineView === 'day' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}"
                  >
                    Vue Jour
                  </button>
                  <button
                    onclick={() => timelineView = 'week'}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {timelineView === 'week' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}"
                  >
                    Vue Semaine
                  </button>
                </div>
                <div class="flex items-center gap-4">
                  <label for="date-picker" class="text-sm font-medium text-white/80">
                    Sélectionner une date :
                  </label>
                  <input
                    id="date-picker"
                    type="date"
                    bind:value={selectedDate}
                    class="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div class="flex-1 overflow-hidden">
              {#if timelineView === 'day'}
                <DayTimeline {selectedDate} />
              {:else}
                <WeekCalendar {selectedDate} />
              {/if}
            </div>
          </div>
        {:else if activeTab === 'stats'}
          <div class="h-full">
            <StatsPanel />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Task Form Modal -->
  {#if showTaskForm}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-md">
        <TaskForm task={editingTask} onClose={handleCloseForm} />
      </div>
    </div>
  {/if}

  <NotificationModal />

  <!-- Daily Goals Modal -->
  {#if $dailyGoalsStore.showModal}
    <DailyGoalsModal on:close={() => {
      dailyGoalsStore.setLastVisitDate();
      dailyGoalsStore.hideGoalsModal();
    }} />
  {/if}
{/if}
