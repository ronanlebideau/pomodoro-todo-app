<script lang="ts">
	import { pomodoroStore, formattedTime, pomodoroProgress } from '$lib/stores/pomodoroStore';
	import { Play, Pause, Square, Coffee, Brain } from 'lucide-svelte';

	export let taskId: number | null = null;

	$: isRunning = $pomodoroStore.state === 'focus' || $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break';
	$: isPaused = $pomodoroStore.state === 'paused';
	$: isIdle = $pomodoroStore.state === 'idle';
	$: isFocus = $pomodoroStore.state === 'focus';
	$: isBreak = $pomodoroStore.state === 'short-break' || $pomodoroStore.state === 'long-break';

	function handleStart() {
		pomodoroStore.startFocus(taskId);
		requestNotificationPermission();
	}

	function handlePause() {
		pomodoroStore.pause();
	}

	function handleResume() {
		pomodoroStore.resume();
	}

	function handleStop() {
		pomodoroStore.stop();
	}

	function handleStartBreak(isLong: boolean = false) {
		pomodoroStore.startBreak(isLong);
	}

	function requestNotificationPermission() {
		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}

	$: shouldShowLongBreak = $pomodoroStore.completedSessions > 0 && 
		$pomodoroStore.completedSessions % $pomodoroStore.config.sessionsBeforeLongBreak === 0;
</script>

<div class="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
	<!-- Timer Display -->
	<div class="relative w-64 h-64">
		<!-- Progress Circle -->
		<svg class="w-full h-full transform -rotate-90">
			<circle
				cx="128"
				cy="128"
				r="120"
				stroke="currentColor"
				stroke-width="8"
				fill="none"
				class="text-zinc-800"
			/>
			<circle
				cx="128"
				cy="128"
				r="120"
				stroke="currentColor"
				stroke-width="8"
				fill="none"
				class={isFocus ? 'text-red-500' : isBreak ? 'text-green-500' : 'text-zinc-700'}
				stroke-dasharray={2 * Math.PI * 120}
				stroke-dashoffset={2 * Math.PI * 120 * (1 - $pomodoroProgress / 100)}
				class:transition-all={isRunning}
				style="transition-duration: 1s;"
			/>
		</svg>

		<!-- Time Text -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<div class="text-6xl font-bold text-white font-mono">
				{$formattedTime}
			</div>
			<div class="text-sm text-zinc-400 mt-2">
				{#if isFocus}
					Focus
				{:else if $pomodoroStore.state === 'short-break'}
					Pause courte
				{:else if $pomodoroStore.state === 'long-break'}
					Pause longue
				{:else if isPaused}
					En pause
				{:else}
					Prêt
				{/if}
			</div>
		</div>
	</div>

	<!-- Session Counter -->
	<div class="flex items-center gap-2">
		<Brain class="w-4 h-4 text-zinc-400" />
		<span class="text-sm text-zinc-400">
			{$pomodoroStore.completedSessions} session{$pomodoroStore.completedSessions !== 1 ? 's' : ''} complétée{$pomodoroStore.completedSessions !== 1 ? 's' : ''}
		</span>
	</div>

	<!-- Controls -->
	<div class="flex gap-3">
		{#if isIdle}
			<button
				on:click={handleStart}
				class="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
			>
				<Play class="w-5 h-5" />
				Démarrer Focus
			</button>
		{:else if isPaused}
			<button
				on:click={handleResume}
				class="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
			>
				<Play class="w-5 h-5" />
				Reprendre
			</button>
			<button
				on:click={handleStop}
				class="flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
			>
				<Square class="w-5 h-5" />
				Arrêter
			</button>
		{:else if isRunning}
			<button
				on:click={handlePause}
				class="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
			>
				<Pause class="w-5 h-5" />
				Pause
			</button>
			<button
				on:click={handleStop}
				class="flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
			>
				<Square class="w-5 h-5" />
				Arrêter
			</button>
		{/if}
	</div>

	<!-- Break Buttons (shown when idle or after completing focus) -->
	{#if isIdle && $pomodoroStore.completedSessions > 0}
		<div class="flex gap-3 pt-4 border-t border-zinc-800 w-full justify-center">
			<button
				on:click={() => handleStartBreak(false)}
				class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
			>
				<Coffee class="w-4 h-4" />
				Pause courte (5 min)
			</button>
			{#if shouldShowLongBreak}
				<button
					on:click={() => handleStartBreak(true)}
					class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
				>
					<Coffee class="w-4 h-4" />
					Pause longue (15 min)
				</button>
			{/if}
		</div>
	{/if}
</div>
