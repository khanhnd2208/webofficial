import SpyGame from '@/models/SpyGame';
import type { PlayerRole, RoomStateDTO } from '@/types/spyGame';
import {
	confirmMemorized,
	createRoom,
	getScopedState,
	hostAdvancePhase,
	joinRoom,
	markSpoke,
	resolveMrWhite,
	setReady,
	setSuspect,
	startGame,
	submitRunoffVote,
	submitVote,
} from '@/services/spyGameService';

export type VotePattern =
	| { mode: 'role'; vote1: PlayerRole; vote2?: PlayerRole }
	| { mode: 'token'; vote1: string; vote2?: string }
	| { mode: 'equal' }
	| { mode: 'none' };

export class SpyGameHelper {
	readonly code: string;
	readonly hostToken: string;
	readonly tokens: string[];

	private constructor(code: string, hostToken: string, tokens: string[]) {
		this.code = code;
		this.hostToken = hostToken;
		this.tokens = tokens;
	}

	static async create(
		playerCount: number,
		options?: { isPublic?: boolean; hideRoles?: boolean },
	): Promise<SpyGameHelper> {
		const host = await createRoom({
			name: `Test ${playerCount}p`,
			hostName: 'Host',
			isPublic: options?.isPublic ?? false,
			hideRoles: options?.hideRoles ?? false,
		});

		const tokens: string[] = [host.self!.token];
		for (let i = 2; i <= playerCount; i++) {
			const { playerToken } = await joinRoom(host.code, `Player${i}`);
			tokens.push(playerToken);
		}

		return new SpyGameHelper(host.code, host.self!.token, tokens);
	}

	async runToRoleReveal(): Promise<RoomStateDTO> {
		for (const t of this.tokens) await setReady(this.code, t, true);
		return startGame(this.code, this.hostToken);
	}

	async runToOpening(): Promise<RoomStateDTO> {
		await this.runToRoleReveal();
		for (const t of this.tokens) await confirmMemorized(this.code, t);
		return getScopedState(this.code, this.hostToken);
	}

	async runToDiscussion(
		suspectPattern?: (token: string, role: PlayerRole | undefined) => string | string[] | null,
	): Promise<RoomStateDTO> {
		await this.runToOpening();
		for (const t of this.tokens) await markSpoke(this.code, t);

		if (suspectPattern) {
			for (const t of this.tokens) {
				const role = await this.getRole(t);
				const target = suspectPattern(t, role);
				if (target !== undefined && target !== null) {
					const tokens = Array.isArray(target) ? target : [target];
					await setSuspect(this.code, t, tokens);
				}
			}
		}

		return getScopedState(this.code, this.hostToken);
	}

	async runToVote(): Promise<RoomStateDTO> {
		await this.runToDiscussion();
		return hostAdvancePhase(this.code, this.hostToken);
	}

	async getRole(token: string): Promise<PlayerRole | undefined> {
		const game = await this.loadGame();
		return game?.players.find((p) => p.token === token)?.role;
	}

	async getPlayerByRole(role: PlayerRole): Promise<string> {
		for (const t of this.tokens) {
			if ((await this.getRole(t)) === role) return t;
		}
		throw new Error(`No player with role ${role}`);
	}

	async getPlayersByRole(role: PlayerRole): Promise<string[]> {
		const found: string[] = [];
		for (const t of this.tokens) {
			if ((await this.getRole(t)) === role) found.push(t);
		}
		return found;
	}

	private pickAlternateTarget(voterToken: string, exclude: Set<string>): string | undefined {
		return this.tokens.find((t) => t !== voterToken && !exclude.has(t));
	}

	private async buildBallot(
		voterToken: string,
		pattern: VotePattern,
	): Promise<{ vote1?: string; vote2?: string }> {
		if (pattern.mode === 'none') return {};

		let vote1: string | undefined;
		let vote2: string | undefined;

		if (pattern.mode === 'token') {
			vote1 = pattern.vote1;
			vote2 = pattern.vote2;
		} else if (pattern.mode === 'role') {
			vote1 = await this.getPlayerByRole(pattern.vote1);
			if (pattern.vote2) vote2 = await this.getPlayerByRole(pattern.vote2);
		} else {
			const idx = this.tokens.indexOf(voterToken);
			vote1 = this.tokens[(idx + 1) % this.tokens.length]!;
			vote2 = this.tokens[(idx + 2) % this.tokens.length]!;
		}

		const used = new Set<string>();
		if (!vote1 || vote1 === voterToken) {
			vote1 = this.pickAlternateTarget(voterToken, used);
		}
		if (vote1) used.add(vote1);

		if (!vote2 || vote2 === voterToken || vote2 === vote1) {
			vote2 = this.pickAlternateTarget(voterToken, used);
		}

		return { vote1, vote2 };
	}

	async voteAll(
		pattern: VotePattern,
		options?: { confirmed?: boolean; partial?: boolean; fromCurrentPhase?: boolean },
	): Promise<RoomStateDTO> {
		if (!options?.fromCurrentPhase) {
			await this.runToVote();
		}

		const confirmed = options?.confirmed ?? true;
		const partial = options?.partial ?? false;

		for (const t of this.tokens) {
			const targets = await this.buildBallot(t, pattern);
			if (targets.vote1) {
				await submitVote(this.code, t, {
					vote1Token: targets.vote1,
					...(partial ? {} : { vote2Token: targets.vote2 }),
					...(confirmed ? { confirmed: true } : {}),
				});
			} else if (pattern.mode === 'none') {
				await submitVote(this.code, t, { ...(confirmed ? { confirmed: true } : {}) });
			}
		}

		return getScopedState(this.code, this.hostToken);
	}

	async submitRunoffAll(choicesByVoter?: Map<string, string[]>): Promise<RoomStateDTO> {
		for (const t of this.tokens) {
			const choices = choicesByVoter?.get(t) ?? [];
			if (choices.length > 0) {
				await submitRunoffVote(this.code, t, { choices });
			}
		}
		return getScopedState(this.code, this.hostToken);
	}

	async resolveMrWhiteGuess(guessResult: 'correct' | 'incorrect'): Promise<RoomStateDTO> {
		for (const t of this.tokens) {
			const s = await getScopedState(this.code, t);
			if (s.mrWhite?.canConfirm) {
				return resolveMrWhite(this.code, t, { guessResult });
			}
		}
		throw new Error('No confirmer found for Mr. White guess');
	}

	async finalize(options?: {
		guessResult?: 'correct' | 'incorrect';
		runoffChoices?: Map<string, string[]>;
	}): Promise<RoomStateDTO> {
		let state = await getScopedState(this.code, this.hostToken);

		if (state.phase === 'vote') {
			state = await hostAdvancePhase(this.code, this.hostToken);
		}

		if (state.phase === 'runoff') {
			if (options?.runoffChoices) {
				state = await this.submitRunoffAll(options.runoffChoices);
			}
			state = await hostAdvancePhase(this.code, this.hostToken);
		}

		if (state.phase === 'mrwhite-guess') {
			state = await this.resolveMrWhiteGuess(options?.guessResult ?? 'incorrect');
		}

		return state;
	}

	async state(token?: string): Promise<RoomStateDTO> {
		return getScopedState(this.code, token ?? this.hostToken);
	}

	async loadGame() {
		return SpyGame.findOne({ code: this.code.toUpperCase() });
	}
}
