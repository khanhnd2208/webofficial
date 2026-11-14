import { describe, expect, it } from 'vitest';

import { newManualPlayer, type ArenaHistoryEntry } from './arenaGame';
import { entryFromTurn, turnPayload } from './arenaTurnLog';

const base: ArenaHistoryEntry = {
	id: 'abc12345-x',
	at: 1_700_000_000_000,
	enrollmentId: 'enr-1',
	name: 'Nguyễn An',
	cardId: 'card-1',
	result: 'pass',
	award: 1,
	cpAfter: 1,
};

describe('arena turn log payload', () => {
	it('sends a roster student by enrollment, with the run it was played in', () => {
		expect(turnPayload({ ...base, runKey: 's1~abc' })).toEqual({
			clientId: 'abc12345-x',
			playedAt: 1_700_000_000_000,
			runKey: 's1~abc',
			enrollmentId: 'enr-1',
			cardId: 'card-1',
			result: 'pass',
			award: 1,
			cpAfter: 1,
		});
	});

	it('sends a typed-in player by name and group, never the local id', () => {
		const guest = newManualPlayer('Lê Khách', 'SUPPORT');
		const payload = turnPayload({
			...base,
			enrollmentId: guest.id,
			name: 'Lê Khách',
			group: 'SUPPORT',
			cardId: null,
			result: 'fail',
			award: undefined,
			cpAfter: undefined,
		});
		expect(payload).toEqual({
			clientId: 'abc12345-x',
			playedAt: 1_700_000_000_000,
			guestName: 'Lê Khách',
			guestGroup: 'SUPPORT',
			result: 'fail',
		});
	});

	it('turns a saved call back into a synced history entry', () => {
		const entry = entryFromTurn({
			clientId: 'abc12345-x',
			playedAt: 1_700_000_000_000,
			playedOn: '2023-11-15',
			runKey: 's1~abc',
			enrollmentId: null,
			guest: true,
			guestGroup: 'CHALLENGE',
			playerName: 'Lê Khách',
			studentCode: '',
			cardId: null,
			question: '',
			result: 'pass',
			award: 0,
			cpAfter: null,
			giftAfter: null,
		});
		expect(entry).toMatchObject({
			id: 'abc12345-x',
			runKey: 's1~abc',
			name: 'Lê Khách',
			award: 0,
			group: 'CHALLENGE',
			synced: true,
		});
		expect(entry.cpAfter).toBeUndefined();
	});
});
