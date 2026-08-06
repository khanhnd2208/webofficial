import type { MrWhiteGuessResult, PlayerRole, WinningSide } from '@/types/spyGame';

export interface PlayerForWinCheck {
	token: string;
	role: PlayerRole;
}

export interface WinCheckInput {
	playerCount: number;
	eliminatedTokens: string[];
	players: PlayerForWinCheck[];
	mrWhiteGuessResult: MrWhiteGuessResult;
	/** Hidden-role rooms use single-spy win rules regardless of player count */
	hideRoles?: boolean;
}

export interface WinCheckResult {
	winningSide: WinningSide;
	reason: string;
	needsMrWhiteGuess: boolean;
}

export function getEliminatedRoles(
	eliminatedTokens: string[],
	players: PlayerForWinCheck[],
): PlayerRole[] {
	return eliminatedTokens
		.map((token) => players.find((p) => p.token === token)?.role)
		.filter((r): r is PlayerRole => r != null);
}

/**
 * Determine if Mr. White gets to guess (spec §23–24).
 * Hidden-role mode never has Mr. White.
 */
export function shouldMrWhiteGuess(
	eliminatedTokens: string[],
	players: PlayerForWinCheck[],
	hideRoles = false,
): boolean {
	if (hideRoles) return false;
	const roles = getEliminatedRoles(eliminatedTokens, players);
	return roles.includes('mrwhite');
}

/**
 * Win condition tree (spec §25).
 * Hidden-role / 4–6p: Spy caught → Officers win; Officer caught → Spy wins.
 */
export function determineWinner(input: WinCheckInput): WinCheckResult {
	const { playerCount, eliminatedTokens, players, mrWhiteGuessResult, hideRoles } = input;
	const eliminatedRoles = getEliminatedRoles(eliminatedTokens, players);
	const spyCaught = eliminatedRoles.includes('spy');
	const mrWhiteCaught = eliminatedRoles.includes('mrwhite');

	// Hidden-role mode or 4–6 players: single spy, eliminate one
	if (hideRoles || playerCount <= 6) {
		if (spyCaught) {
			return { winningSide: 'civilian', reason: 'Spy bị loại', needsMrWhiteGuess: false };
		}
		return { winningSide: 'antagonist', reason: 'Officer bị loại', needsMrWhiteGuess: false };
	}

	// 7–12 players (normal): spy + Mr. White
	const bothCaught = spyCaught && mrWhiteCaught;

	if (!bothCaught) {
		return {
			winningSide: 'antagonist',
			reason: 'Không bắt đủ Spy và Mr. White',
			needsMrWhiteGuess: false,
		};
	}

	// Both caught — Mr. White gets to guess
	if (mrWhiteGuessResult === 'pending') {
		return {
			winningSide: 'civilian', // provisional
			reason: 'Chờ Mr. White đoán từ',
			needsMrWhiteGuess: true,
		};
	}

	if (mrWhiteGuessResult === 'correct') {
		return {
			winningSide: 'antagonist',
			reason: 'Mr. White đoán đúng từ khóa',
			needsMrWhiteGuess: false,
		};
	}

	return {
		winningSide: 'civilian',
		reason: 'Mr. White đoán sai từ khóa',
		needsMrWhiteGuess: false,
	};
}

/**
 * If spy wasn't caught, antagonists already won regardless of Mr. White guess.
 */
export function isMrWhiteGuessMeaningful(
	eliminatedTokens: string[],
	players: PlayerForWinCheck[],
): boolean {
	const roles = getEliminatedRoles(eliminatedTokens, players);
	return roles.includes('spy') && roles.includes('mrwhite');
}
