import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	markCardKnown,
	parseProgressSnapshot,
	progressSnapshot,
	readDeckProgress,
	subscribeDeckProgress,
	writeDeckProgress,
} from './deckProgress';

describe('deck progress', () => {
	beforeEach(() => localStorage.clear());

	it('keeps the existing resume fields when cards are marked known', () => {
		localStorage.setItem('active-recall:d1', JSON.stringify({ currentId: 'b', shuffled: true }));
		markCardKnown('d1', 'a', true);
		markCardKnown('d1', 'b', true);
		markCardKnown('d1', 'a', false);
		expect(readDeckProgress('d1')).toMatchObject({ currentId: 'b', shuffled: true, known: ['b'] });
		expect(readDeckProgress('d1').studiedAt).toEqual(expect.any(Number));
	});

	it('treats broken storage as no progress', () => {
		localStorage.setItem('active-recall:d1', '{oops');
		expect(readDeckProgress('d1')).toEqual({});
		localStorage.setItem('active-recall:d1', 'null');
		expect(readDeckProgress('d1')).toEqual({});
	});

	it('notifies subscribers in this tab', () => {
		const callback = vi.fn();
		const unsubscribe = subscribeDeckProgress(callback);
		writeDeckProgress('d1', { known: ['a'] });
		expect(callback).toHaveBeenCalledTimes(1);
		unsubscribe();
		writeDeckProgress('d1', { known: [] });
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('summarises decks, counting only cards that still exist', () => {
		writeDeckProgress('d1', { known: ['a', 'gone'], currentId: 'b', studiedAt: 5 });
		const summary = parseProgressSnapshot(
			progressSnapshot([
				{ id: 'd1', cardIds: ['a', 'b', 'c'] },
				{ id: 'd2', cardIds: ['x'] },
			]),
		);
		expect(summary.get('d1')).toEqual({ known: 1, started: true, studiedAt: 5, currentIndex: 1 });
		expect(summary.get('d2')).toEqual({ known: 0, started: false, studiedAt: 0, currentIndex: -1 });
		expect(parseProgressSnapshot('not json').size).toBe(0);
	});
});
