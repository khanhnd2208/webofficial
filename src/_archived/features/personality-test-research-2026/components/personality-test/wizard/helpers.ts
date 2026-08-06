/* ════════════════════════════════════════════════════════════════════════
   Wizard Helpers — Shared utility functions
   ════════════════════════════════════════════════════════════════════════ */

/** Build a unique answer key from test type + item number */
export function getKey(testType: string, itemNumber: number): string {
	return `${testType}-${itemNumber}`;
}

/** Format seconds into m:ss display */
export function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}
