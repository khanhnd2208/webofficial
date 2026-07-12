import { describe, it, expect, beforeEach } from 'vitest';

import { loadQueue, saveQueue, type OfflineAction } from '@/lib/vocab/useOfflineQueue';

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorage.clear());

function enqueueDeduped(action: OfflineAction): void {
	const queue = loadQueue();
	if (action.type === 'SOFT_DELETE') {
		const exists = queue.some(
			(q) => q.type === 'SOFT_DELETE' && q.vocabSetId === action.vocabSetId,
		);
		if (exists) return;
	}
	queue.push(action);
	saveQueue(queue);
}

describe('loadQueue / saveQueue', () => {
	it('persists actions to localStorage', () => {
		saveQueue([{ type: 'SOFT_DELETE', vocabSetId: 'set-1' }]);
		const loaded = loadQueue();
		expect(loaded).toHaveLength(1);
		expect(loaded[0].type).toBe('SOFT_DELETE');
	});

	it('deduplicates SOFT_DELETE for same vocabSetId', () => {
		const action: OfflineAction = { type: 'SOFT_DELETE', vocabSetId: 'set-1' };
		enqueueDeduped(action);
		enqueueDeduped(action);
		expect(loadQueue()).toHaveLength(1);
	});

	it('stores multiple different actions', () => {
		saveQueue([
			{ type: 'SOFT_DELETE', vocabSetId: 'set-1' },
			{ type: 'ADD_TO_LIBRARY', vocabSetId: 'set-2' },
		]);
		expect(loadQueue()).toHaveLength(2);
	});

	it('handles empty localStorage gracefully', () => {
		expect(loadQueue()).toEqual([]);
	});

	it('handles corrupted localStorage gracefully', () => {
		localStorage.setItem('vocab_offline_queue', 'not-valid-json');
		expect(loadQueue()).toEqual([]);
	});
});
