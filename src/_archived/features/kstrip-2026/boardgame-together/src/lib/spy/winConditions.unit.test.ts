import { describe, expect, it } from 'vitest';

import {
	determineWinner,
	isMrWhiteGuessMeaningful,
	shouldMrWhiteGuess,
} from '@/lib/spy/winConditions';

const players = [
	{ token: 'c1', role: 'civilian' as const },
	{ token: 'c2', role: 'civilian' as const },
	{ token: 'c3', role: 'civilian' as const },
	{ token: 'c4', role: 'civilian' as const },
	{ token: 'c5', role: 'civilian' as const },
	{ token: 'spy', role: 'spy' as const },
	{ token: 'mw', role: 'mrwhite' as const },
];

describe('determineWinner', () => {
	it('4-6 players: spy caught => civilians win', () => {
		const result = determineWinner({
			playerCount: 5,
			eliminatedTokens: ['spy'],
			players: players.slice(0, 6),
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('civilian');
	});

	it('4-6 players: civilian caught => antagonists win', () => {
		const result = determineWinner({
			playerCount: 5,
			eliminatedTokens: ['c1'],
			players: players.slice(0, 6),
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7+ players: not both caught => antagonists win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['spy', 'c1'],
			players,
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7+ players: both caught, Mr White correct => antagonists win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['spy', 'mw'],
			players,
			mrWhiteGuessResult: 'correct',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7+ players: both caught, Mr White wrong => civilians win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['spy', 'mw'],
			players,
			mrWhiteGuessResult: 'incorrect',
		});
		expect(result.winningSide).toBe('civilian');
	});

	it('6-player boundary: spy caught => civilians win', () => {
		const result = determineWinner({
			playerCount: 6,
			eliminatedTokens: ['spy'],
			players: players.slice(0, 6),
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('civilian');
	});

	it('6-player boundary: civilian caught => antagonists win', () => {
		const result = determineWinner({
			playerCount: 6,
			eliminatedTokens: ['c1'],
			players: players.slice(0, 6),
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7-player boundary: both caught, guess incorrect => civilians win', () => {
		const result = determineWinner({
			playerCount: 7,
			eliminatedTokens: ['spy', 'mw'],
			players,
			mrWhiteGuessResult: 'incorrect',
		});
		expect(result.winningSide).toBe('civilian');
	});

	it('7-player boundary: both caught, guess correct => antagonists win', () => {
		const result = determineWinner({
			playerCount: 7,
			eliminatedTokens: ['spy', 'mw'],
			players,
			mrWhiteGuessResult: 'correct',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7+ players: only mrwhite caught => antagonists win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['mw', 'c1'],
			players,
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('7+ players: spy + civilian caught (not mrwhite) => antagonists win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['spy', 'c1'],
			players,
			mrWhiteGuessResult: 'pending',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('skipped guess when spy not caught still antagonist win', () => {
		const result = determineWinner({
			playerCount: 8,
			eliminatedTokens: ['mw', 'c1'],
			players,
			mrWhiteGuessResult: 'skipped',
		});
		expect(result.winningSide).toBe('antagonist');
	});

	it('hideRoles 7p: spy caught => civilians win (no mrwhite path)', () => {
		const result = determineWinner({
			playerCount: 7,
			eliminatedTokens: ['spy'],
			players,
			mrWhiteGuessResult: 'skipped',
			hideRoles: true,
		});
		expect(result.winningSide).toBe('civilian');
		expect(result.needsMrWhiteGuess).toBe(false);
	});

	it('hideRoles 12p: civilian caught => antagonists win', () => {
		const result = determineWinner({
			playerCount: 12,
			eliminatedTokens: ['c1'],
			players,
			mrWhiteGuessResult: 'skipped',
			hideRoles: true,
		});
		expect(result.winningSide).toBe('antagonist');
		expect(result.needsMrWhiteGuess).toBe(false);
	});
});

describe('shouldMrWhiteGuess', () => {
	it('returns true when mrwhite eliminated', () => {
		expect(shouldMrWhiteGuess(['mw'], players)).toBe(true);
	});

	it('returns false when hideRoles', () => {
		expect(shouldMrWhiteGuess(['mw'], players, true)).toBe(false);
	});
});

describe('isMrWhiteGuessMeaningful', () => {
	it('requires both spy and mrwhite eliminated', () => {
		expect(isMrWhiteGuessMeaningful(['spy', 'mw'], players)).toBe(true);
		expect(isMrWhiteGuessMeaningful(['mw'], players)).toBe(false);
	});
});
