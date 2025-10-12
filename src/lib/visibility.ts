// src/lib/visibility.ts
export function setupVisibilityHandler(callback: (isVisible: boolean) => void) {
	// Only run in browser environment
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return () => {}; // Return empty cleanup function
	}

	// Set initial state
	const isVisible = !document.hidden;
	callback(isVisible);

	// Listen for visibility changes
	const handleVisibilityChange = () => {
		callback(!document.hidden);
	};

	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return cleanup function
	return () => {
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}
