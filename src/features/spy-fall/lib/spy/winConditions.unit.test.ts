import { describe, expect, it } from 'vitest';

import { checkOutcome } from '@/features/spy-fall/lib/spy/winConditions';
import type { OutcomePlayer } from '@/features/spy-fall/lib/spy/winConditions';

function table(
	civilians: number,
	out: { civilians?: number; spy?: boolean } = {},
): OutcomePlayer[] {
	const players: OutcomePlayer[] = [];
	for (let i = 0; i < civilians; i++) {
		players.push({ role: 'civilian', isEliminated: i < (out.civilians ?? 0) });
	}
	players.push({ role: 'spy', isEliminated: Boolean(out.spy) });
	return players;
}

describe('checkOutcome', () => {
	it('civilians win when the spy is caught on round 1 or 2 of a 4-player game', () => {
		expect(checkOutcome(table(3, { spy: true }))).toBe('civilian');
		expect(checkOutcome(table(3, { civilians: 1, spy: true }))).toBe('civilian');
	});

	it('the spy wins after two mistaken eliminations at 4 players', () => {
		expect(checkOutcome(table(3, { civilians: 1 }))).toBeNull();
		expect(checkOutcome(table(3, { civilians: 2 }))).toBe('antagonist');
	});

	it('a 7-player game allows five mistakes before the spy wins', () => {
		expect(checkOutcome(table(6, { civilians: 4 }))).toBeNull();
		expect(checkOutcome(table(6, { civilians: 5 }))).toBe('antagonist');
	});
});
