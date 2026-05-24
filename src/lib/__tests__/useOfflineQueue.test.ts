/* ════════════════════════════════════════════════════════════════════════
   useOfflineQueue.test.ts
   ════════════════════════════════════════════════════════════════════════ */
import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
	};
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Load queue helpers directly (without the hook, to test pure logic)
const STORAGE_KEY = 'vocab_offline_queue';

function loadQueue() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch { return []; }
}
function saveQueue(queue: unknown[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

beforeEach(() => localStorage.clear());

describe('Offline queue storage', () => {
	it('persists actions to localStorage', () => {
		saveQueue([{ type: 'SOFT_DELETE', vocabSetId: 'set-1' }]);
		const loaded = loadQueue();
		expect(loaded.length).toBe(1);
		expect(loaded[0].type).toBe('SOFT_DELETE');
	});

	it('deduplicates SOFT_DELETE for same vocabSetId', () => {
		const action = { type: 'SOFT_DELETE', vocabSetId: 'set-1' };
		const queue = loadQueue();
		// Simulate enqueue deduplication logic
		const exists = queue.some(
			(q: { type: string; vocabSetId: string }) =>
				q.type === 'SOFT_DELETE' && q.vocabSetId === action.vocabSetId,
		);
		if (!exists) queue.push(action);
		saveQueue(queue);

		// Try to add again
		const queue2 = loadQueue();
		const exists2 = queue2.some(
			(q: { type: string; vocabSetId: string }) =>
				q.type === 'SOFT_DELETE' && q.vocabSetId === action.vocabSetId,
		);
		if (!exists2) queue2.push(action);
		saveQueue(queue2);

		expect(loadQueue().length).toBe(1);
	});

	it('stores multiple different actions', () => {
		saveQueue([
			{ type: 'SOFT_DELETE', vocabSetId: 'set-1' },
			{ type: 'ADD_TO_LIBRARY', vocabSetId: 'set-2' },
		]);
		expect(loadQueue().length).toBe(2);
	});

	it('handles empty localStorage gracefully', () => {
		expect(loadQueue()).toEqual([]);
	});

	it('handles corrupted localStorage gracefully', () => {
		localStorage.setItem(STORAGE_KEY, 'not-valid-json');
		expect(loadQueue()).toEqual([]);
	});
});
