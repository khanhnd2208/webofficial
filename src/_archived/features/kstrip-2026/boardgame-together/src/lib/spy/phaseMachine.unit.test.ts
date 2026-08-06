import { describe, expect, it } from 'vitest';

import {
	allPlayersMemorized,
	allPlayersSpoken,
	allVotesConfirmed,
	computePhaseAdvance,
	startMrWhiteGuessPhase,
	startResultPhase,
	startRunoffPhase,
	startVotePhase,
} from '@/lib/spy/phaseMachine';

describe('phaseMachine', () => {
	const basePlayers = [
		{ token: 'p1', hasMemorizedRole: false, hasSpoken: false, voteConfirmed: false, connected: true },
		{ token: 'p2', hasMemorizedRole: false, hasSpoken: false, voteConfirmed: false, connected: true },
	];

	it('advances role-reveal when all memorized', () => {
		const players = basePlayers.map((p) => ({ ...p, hasMemorizedRole: true }));
		const result = computePhaseAdvance({
			phase: 'role-reveal',
			playerCount: 4,
			players,
			allSpoken: false,
			hasRunoff: false,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result?.nextPhase).toBe('opening');
		expect(result?.reason).toBe('all-memorized');
	});

	it('does not auto-advance discussion (host advances manually)', () => {
		const result = computePhaseAdvance({
			phase: 'discussion',
			playerCount: 5,
			players: basePlayers,
			allSpoken: false,
			hasRunoff: false,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result).toBeNull();
	});

	it('allPlayersSpoken / allPlayersMemorized', () => {
		expect(allPlayersSpoken([{ ...basePlayers[0]!, hasSpoken: true }])).toBe(true);
		expect(allPlayersMemorized([{ ...basePlayers[0]!, hasMemorizedRole: true }])).toBe(true);
	});

	it('allVotesConfirmed', () => {
		expect(allVotesConfirmed([{ ...basePlayers[0]!, voteConfirmed: true }])).toBe(true);
		expect(allVotesConfirmed(basePlayers)).toBe(false);
	});

	it('advances opening when all spoken without a timer', () => {
		const players = basePlayers.map((p) => ({ ...p, hasSpoken: true }));
		const result = computePhaseAdvance({
			phase: 'opening',
			playerCount: 4,
			players,
			allSpoken: true,
			hasRunoff: false,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result?.nextPhase).toBe('discussion');
		expect(result?.reason).toBe('all-spoken');
	});

	it('does not auto-advance vote when all confirmed (host closes manually)', () => {
		const players = basePlayers.map((p) => ({ ...p, voteConfirmed: true }));
		const result = computePhaseAdvance({
			phase: 'vote',
			playerCount: 4,
			players,
			allSpoken: false,
			hasRunoff: false,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result).toBeNull();
	});

	it('does not auto-advance runoff (host closes manually)', () => {
		const result = computePhaseAdvance({
			phase: 'runoff',
			playerCount: 4,
			players: basePlayers,
			allSpoken: false,
			hasRunoff: true,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result).toBeNull();
	});

	it('returns null when no condition met', () => {
		const result = computePhaseAdvance({
			phase: 'lobby',
			playerCount: 4,
			players: basePlayers,
			allSpoken: false,
			hasRunoff: false,
			needsMrWhiteGuess: false,
			voteLocked: false,
			now: new Date(),
		});
		expect(result).toBeNull();
	});

	it('start phase helpers return correct phases', () => {
		expect(startRunoffPhase().nextPhase).toBe('runoff');
		expect(startMrWhiteGuessPhase().nextPhase).toBe('mrwhite-guess');
		expect(startResultPhase().nextPhase).toBe('result');
		expect(startVotePhase().nextPhase).toBe('vote');
	});
});
