import { beforeEach, describe, expect, it } from 'vitest';

import { SPY_DISCONNECT_THRESHOLD_MS } from '@/config/spyGame';
import SpyGame from '@/models/SpyGame';
import { SpyGameHelper } from '@/test/helpers/spyGameHelper';
import {
	createRoom,
	forceAdvanceDiscussion,
	getScopedState,
	hostAdvancePhase,
	joinRoom,
	markSpoke,
	confirmMemorized,
	playAgain,
	restartRoom,
	setReady,
	setSuspect,
	startGame,
	submitVote,
	updateSettings,
} from '@/services/spyGameService';

describe('spyGameService integration', () => {
	beforeEach(async () => {
		await SpyGame.deleteMany({});
	});

	describe('lobby basics', () => {
		it('creates room and joins players', async () => {
			const host = await createRoom({ name: 'Test Room', hostName: 'Host' });
			expect(host.code).toHaveLength(6);
			expect(host.self?.name).toBe('Host');

			const { playerToken, state } = await joinRoom(host.code, 'Player2');
			expect(state.playerCount).toBe(2);
			expect(playerToken).toBeTruthy();
		});

		it('blocks join during active game', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToRoleReveal();
			await expect(joinRoom(helper.code, 'Late')).rejects.toThrow(/GAME_IN_PROGRESS/);
		});

		it('reconnect reuses existing token', async () => {
			const host = await createRoom({ name: 'Reconnect', hostName: 'Host' });
			const first = await joinRoom(host.code, 'Guest');
			const second = await joinRoom(host.code, 'Guest', first.playerToken);
			expect(second.playerToken).toBe(first.playerToken);
			expect(second.state.playerCount).toBe(2);
		});

		it('rejects duplicate name on join', async () => {
			const host = await createRoom({ name: 'Dup', hostName: 'Host' });
			await joinRoom(host.code, 'Same');
			await expect(joinRoom(host.code, 'same')).rejects.toThrow(/NAME_TAKEN/);
		});

		it('rejects join when room is full', async () => {
			const host = await createRoom({ name: 'Full', hostName: 'Host', maxPlayers: 4 });
			await joinRoom(host.code, 'P2');
			await joinRoom(host.code, 'P3');
			await joinRoom(host.code, 'P4');
			await expect(joinRoom(host.code, 'P5')).rejects.toThrow(/ROOM_FULL/);
		});
	});

	describe('lobby settings guards', () => {
		it('non-host cannot start game', async () => {
			const helper = await SpyGameHelper.create(4);
			for (const t of helper.tokens) await setReady(helper.code, t, true);
			const guest = helper.tokens[1]!;
			await expect(startGame(helper.code, guest)).rejects.toMatchObject({ status: 403 });
		});

		it('start with fewer than 4 players throws', async () => {
			const host = await createRoom({ name: 'Small', hostName: 'Host' });
			await joinRoom(host.code, 'P2');
			await setReady(host.code, host.self!.token, true);
			await setReady(host.code, (await joinRoom(host.code, 'P3')).playerToken, true);
			await expect(startGame(host.code, host.self!.token)).rejects.toThrow(/NEED_MIN_PLAYERS/);
		});

		it('start when not all ready throws', async () => {
			const helper = await SpyGameHelper.create(4);
			await setReady(helper.code, helper.hostToken, true);
			await expect(startGame(helper.code, helper.hostToken)).rejects.toThrow(/ALL_MUST_READY/);
		});

		it('updateSettings in lobby works', async () => {
			const host = await createRoom({ name: 'Settings', hostName: 'Host' });
			const updated = await updateSettings(host.code, host.self!.token, {
				topic: 'đồ ăn Việt Nam',
				difficulty: 'hard',
				playtestMode: true,
			});
			expect(updated.topic).toBe('đồ ăn Việt Nam');
			expect(updated.difficulty).toBe('hard');
			expect(updated.playtestMode).toBe(true);
		});

		it('updateSettings during game throws', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToRoleReveal();
			await expect(
				updateSettings(helper.code, helper.hostToken, { name: 'New' }),
			).rejects.toThrow(/SETTINGS_LOBBY_ONLY/);
		});
	});

	describe('phase progression', () => {
		it('starts game with role assignment for 4 players', async () => {
			const helper = await SpyGameHelper.create(4);
			const started = await helper.runToRoleReveal();
			expect(started.phase).toBe('role-reveal');

			const roles = new Set<string>();
			for (const t of helper.tokens) {
				const s = await getScopedState(helper.code, t);
				expect(s.self?.role).toBeTruthy();
				roles.add(s.self!.role!);
			}
			expect(roles.has('spy')).toBe(true);
			expect(roles.has('civilian')).toBe(true);
		});

		it('advances to opening when all memorize roles', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToOpening();
			const state = await helper.state();
			expect(state.phase).toBe('opening');
		});
	});

	describe('4-player full game flows (K=1)', () => {
		it('all vote spy => civilian win', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.voteAll({ mode: 'role', vote1: 'spy' });
			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('civilian');
		});

		it('all vote civilian => antagonist win', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.voteAll({ mode: 'role', vote1: 'civilian' });
			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('antagonist');
		});

		it('no votes still resolves to result', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToVote();
			// Host closes with empty/unconfirmed ballots — no player needs to seal a pick.
			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBeTruthy();
		});
	});

	describe('7-player full game flows (K=2)', () => {
		it('both spy and mrwhite caught, wrong guess => civilian win', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.voteAll({ mode: 'role', vote1: 'spy', vote2: 'mrwhite' });
			const state = await helper.finalize({ guessResult: 'incorrect' });
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('civilian');
			expect(state.phase).toBe('result');
			expect(state.mrWhite).toBeUndefined();
		});

		it('both caught, correct guess => antagonist win', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.voteAll({ mode: 'role', vote1: 'spy', vote2: 'mrwhite' });
			const state = await helper.finalize({ guessResult: 'correct' });
			expect(state.result?.winningSide).toBe('antagonist');
		});

		it('only spy caught => antagonist win, no mrwhite-guess', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.voteAll({ mode: 'role', vote1: 'spy', vote2: 'civilian' });
			const state = await helper.finalize();
			expect(state.result?.winningSide).toBe('antagonist');
			expect(state.result?.mrWhiteGuessResult).not.toBe('correct');
		});

		it('only mrwhite caught => antagonist win', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.voteAll({ mode: 'role', vote1: 'mrwhite', vote2: 'civilian' });
			const state = await helper.finalize();
			expect(state.result?.winningSide).toBe('antagonist');
		});

		it('neither spy nor mrwhite caught => antagonist win', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.runToVote();
			const civilians = await helper.getPlayersByRole('civilian');

			for (const t of helper.tokens) {
				const targets = civilians.filter((c) => c !== t);
				await submitVote(helper.code, t, {
					vote1Token: targets[0]!,
					vote2Token: targets[1]!,
					confirmed: true,
				});
			}
			const state = await helper.finalize();
			expect(state.result?.winningSide).toBe('antagonist');
		});

		it('host is mrwhite => another player confirms guess', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.runToRoleReveal();

			const game = await helper.loadGame();
			const mrWhite = game!.players.find((p) => p.role === 'mrwhite')!;
			game!.hostToken = mrWhite.token;
			await game!.save();

			for (const t of helper.tokens) await confirmMemorized(helper.code, t);
			for (const t of helper.tokens) await markSpoke(helper.code, t);
			await forceAdvanceDiscussion(helper.code, mrWhite.token);

			await helper.voteAll(
				{ mode: 'role', vote1: 'spy', vote2: 'mrwhite' },
				{ fromCurrentPhase: true },
			);

			let state = await hostAdvancePhase(helper.code, mrWhite.token);
			expect(state.phase).toBe('mrwhite-guess');
			expect(state.mrWhite?.canConfirm).toBe(false);

			state = await helper.resolveMrWhiteGuess('incorrect');
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('civilian');
		});
	});

	describe('tie-break flows', () => {
		it('4-player equal votes triggers runoff then result', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.voteAll({ mode: 'equal' });
			let state = await helper.state();
			if (state.phase === 'runoff') {
				const candidates = state.runoff!.candidateTokens;
				const choices = new Map<string, string[]>();
				for (const t of helper.tokens) {
					const pick = candidates.find((c) => c !== t) ?? candidates[0]!;
					choices.set(t, [pick]);
				}
				state = await helper.submitRunoffAll(choices);
			}
			state = await helper.finalize();
			expect(state.phase).toBe('result');
		});
	});

	describe('suspect marking', () => {
		it('marks, changes, and clears suspect counts', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToDiscussion();
			const spy = await helper.getPlayerByRole('spy');
			const voter = helper.tokens.find((t) => t !== spy)!;

			await setSuspect(helper.code, voter, [spy]);
			let state = await getScopedState(helper.code, voter);
			let target = state.players.find((p) => p.token === spy);
			expect(target?.suspicionCount).toBe(1);

			const other = helper.tokens.find((t) => t !== spy && t !== voter)!;
			await setSuspect(helper.code, voter, [other]);
			state = await getScopedState(helper.code, voter);
			target = state.players.find((p) => p.token === spy);
			expect(target?.suspicionCount).toBe(0);
			const otherPlayer = state.players.find((p) => p.token === other);
			expect(otherPlayer?.suspicionCount).toBe(1);

			await setSuspect(helper.code, voter, []);
			state = await getScopedState(helper.code, voter);
			expect(state.players.find((p) => p.token === other)?.suspicionCount).toBe(0);
		});

		it('cannot mark self as suspect', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToDiscussion();
			await expect(setSuspect(helper.code, helper.hostToken, [helper.hostToken])).rejects.toThrow(
				/SUSPECT_SELF/,
			);
		});
	});

	describe('vote mechanics', () => {
		it('rejects self-vote and duplicate picks', async () => {
			const helper4 = await SpyGameHelper.create(4);
			await helper4.runToVote();
			await expect(
				submitVote(helper4.code, helper4.hostToken, {
					vote1Token: helper4.hostToken,
					confirmed: true,
				}),
			).rejects.toThrow(/VOTE_SELF/);

			const helper7 = await SpyGameHelper.create(7);
			await helper7.runToVote();
			const other = helper7.tokens[1]!;
			await expect(
				submitVote(helper7.code, helper7.hostToken, {
					vote1Token: other,
					vote2Token: other,
					confirmed: true,
				}),
			).rejects.toThrow(/VOTE_DUPLICATE/);
		});

		it('rejects vote before vote phase', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToDiscussion();
			const target = helper.tokens[1]!;
			await expect(
				submitVote(helper.code, helper.hostToken, { vote1Token: target }),
			).rejects.toThrow(/NOT_VOTE|ROOM_OR_PHASE_INVALID/);
		});

		it('partial vote counted when host closes', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToVote();
			const spy = await helper.getPlayerByRole('spy');
			const spyVoteTarget = helper.tokens.find((t) => t !== spy)!;

			for (const t of helper.tokens) {
				if (t === spy) continue;
				await submitVote(helper.code, t, {
					vote1Token: spy,
					confirmed: true,
				});
			}
			await submitVote(helper.code, spy, { vote1Token: spyVoteTarget, confirmed: true });

			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.eliminatedTokens).toContain(spy);
		});

		it('host can close vote with unconfirmed ballots', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToVote();
			const spy = await helper.getPlayerByRole('spy');
			const voter = helper.tokens.find((t) => t !== spy)!;

			await submitVote(helper.code, voter, { vote1Token: spy });
			// no confirm — host closes manually
			const { hostAdvancePhase } = await import('@/services/spyGameService');
			const state = await hostAdvancePhase(helper.code, helper.hostToken);
			expect(['result', 'runoff', 'mrwhite-guess']).toContain(state.phase);
		});
	});

	describe('privacy enforcement', () => {
		it('hides other players roles and keywords during game', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToOpening();

			for (const viewer of helper.tokens) {
				const state = await getScopedState(helper.code, viewer);
				for (const p of state.players) {
					if (p.token !== viewer) {
						expect((p as { role?: string }).role).toBeUndefined();
						expect((p as { keyword?: string }).keyword).toBeUndefined();
					}
				}
			}
		});

		it('each role only sees own keyword', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.runToRoleReveal();

			const spyState = await getScopedState(helper.code, await helper.getPlayerByRole('spy'));
			expect(spyState.self?.keyword).toBeTruthy();
			expect(spyState.result?.civilianWord).toBeUndefined();

			const civState = await getScopedState(
				helper.code,
				(await helper.getPlayersByRole('civilian'))[0]!,
			);
			expect(civState.self?.keyword).toBeTruthy();

			const mwState = await getScopedState(helper.code, await helper.getPlayerByRole('mrwhite'));
			expect(mwState.self?.keyword).toBeNull();
			expect(mwState.self?.teammateName).toBeTruthy();
		});

		it('spy and mrwhite know each other by name', async () => {
			const helper = await SpyGameHelper.create(7);
			await helper.runToRoleReveal();

			const spyToken = await helper.getPlayerByRole('spy');
			const mwToken = await helper.getPlayerByRole('mrwhite');
			const spyState = await getScopedState(helper.code, spyToken);
			const mwState = await getScopedState(helper.code, mwToken);

			expect(spyState.self?.teammateName).toBe(mwState.self?.name);
			expect(mwState.self?.teammateName).toBe(spyState.self?.name);
		});

		it('does not expose who-suspects-whom, only counts', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToDiscussion();
			const spy = await helper.getPlayerByRole('spy');
			const voter = (await helper.getPlayersByRole('civilian'))[0]!;
			await setSuspect(helper.code, voter, [spy]);

			const state = await getScopedState(helper.code, helper.tokens[1]!);
			for (const p of state.players) {
				expect((p as { publicSuspectTokens?: string[] }).publicSuspectTokens).toBeUndefined();
			}
			expect(state.players.find((p) => p.token === spy)?.suspicionCount).toBe(1);
		});
	});

	describe('host migration', () => {
		it('migrates host when disconnected', async () => {
			const helper = await SpyGameHelper.create(4);
			const game = await helper.loadGame();
			const oldHost = game!.hostToken;
			const player = game!.players.find((p) => p.token === oldHost)!;
			player.lastSeenAt = new Date(Date.now() - SPY_DISCONNECT_THRESHOLD_MS - 1000);
			player.connected = false;
			await game!.save();

			const state = await getScopedState(helper.code, helper.tokens[1]!);
			const newHost = state.players.find((p) => p.isHost);
			expect(newHost?.token).not.toBe(oldHost);
			expect(state.isHost).toBe(state.self?.token === newHost?.token);
		});
	});

	describe('host confirm-all via /next', () => {
		it('host skips role-reveal to opening for all players', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToRoleReveal();
			const before = await helper.state();
			const versionBefore = before.version;

			const state = await hostAdvancePhase(helper.code, helper.hostToken);
			expect(state.phase).toBe('opening');
			expect(state.version).toBeGreaterThan(versionBefore);
			expect(state.players.every((p) => p.hasMemorizedRole)).toBe(true);

			const guest = await getScopedState(helper.code, helper.tokens[1]!);
			expect(guest.phase).toBe('opening');
			expect(guest.self?.hasMemorizedRole).toBe(true);
		});

		it('host skips opening to discussion without a timer', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToOpening();
			const before = await helper.state();
			const versionBefore = before.version;

			const state = await hostAdvancePhase(helper.code, helper.hostToken);
			expect(state.phase).toBe('discussion');
			expect(state.version).toBeGreaterThan(versionBefore);
			expect(state.players.every((p) => p.hasSpoken)).toBe(true);

			const guest = await getScopedState(helper.code, helper.tokens[1]!);
			expect(guest.phase).toBe('discussion');
			expect(guest.self?.hasSpoken).toBe(true);
		});

		it('non-host cannot confirm-all on role-reveal or opening', async () => {
			const helperReveal = await SpyGameHelper.create(4);
			await helperReveal.runToRoleReveal();
			await expect(
				hostAdvancePhase(helperReveal.code, helperReveal.tokens[1]!),
			).rejects.toMatchObject({ status: 403 });

			const helperOpening = await SpyGameHelper.create(4);
			await helperOpening.runToOpening();
			await expect(
				hostAdvancePhase(helperOpening.code, helperOpening.tokens[1]!),
			).rejects.toMatchObject({ status: 403 });
		});

		it('rejects host advance from lobby/result/mrwhite-guess', async () => {
			const helper = await SpyGameHelper.create(4);
			await expect(hostAdvancePhase(helper.code, helper.hostToken)).rejects.toThrow(/CANNOT_ADVANCE/);

			await helper.voteAll({ mode: 'role', vote1: 'spy' });
			await helper.finalize();
			await expect(hostAdvancePhase(helper.code, helper.hostToken)).rejects.toThrow(/CANNOT_ADVANCE/);
		});
	});

	describe('restart room', () => {
		async function expectResetToLobby(helper: SpyGameHelper, state: Awaited<ReturnType<typeof helper.state>>) {
			expect(state.phase).toBe('lobby');
			expect(state.code).toBe(helper.code);
			expect(state.playerCount).toBe(helper.tokens.length);
			expect(state.players.every((p) => p.isReady === false)).toBe(true);
			expect(state.players.every((p) => p.hasMemorizedRole === false)).toBe(true);
			expect(state.players.every((p) => p.hasSpoken === false)).toBe(true);
			expect(state.players.every((p) => p.isEliminated === false)).toBe(true);
			expect(state.wordPair).toBeUndefined();
			expect(state.runoff).toBeUndefined();
			expect(state.result?.winningSide).toBeUndefined();

			// Assert DB cleanup before any getScopedState save can re-hydrate nested paths.
			const lean = await SpyGame.findOne({ code: helper.code }).lean();
			expect(lean?.wordPair).toBeUndefined();
			expect(lean?.startedAt).toBeUndefined();
			expect(lean?.phaseEndsAt).toBeUndefined();
			expect(lean?.runoff).toBeUndefined();
			expect(lean?.debug).toBeUndefined();
			for (const p of lean?.players ?? []) {
				expect(p.role).toBeUndefined();
				expect(p.keyword).toBeUndefined();
				expect(p.teammateName).toBeUndefined();
				expect(p.vote1Token).toBeUndefined();
				expect(p.vote2Token).toBeUndefined();
				expect(p.isReady).toBe(false);
				expect(p.hasMemorizedRole).toBe(false);
				expect(p.hasSpoken).toBe(false);
				expect(p.isEliminated).toBe(false);
				expect(p.publicSuspectTokens ?? []).toEqual([]);
			}

			const game = await helper.loadGame();
			expect(game!.phase).toBe('lobby');
			expect(game!.eliminatedTokens).toEqual([]);
			expect(game!.wordsRevealed).toBe(false);
			expect(game!.players).toHaveLength(helper.tokens.length);
			expect(game!.hostToken).toBe(helper.hostToken);

			for (const t of helper.tokens) {
				const scoped = await getScopedState(helper.code, t);
				expect(scoped.phase).toBe('lobby');
				expect(scoped.self?.role).toBeFalsy();
				expect(scoped.self?.keyword).toBeFalsy();
				expect(scoped.self?.teammateName).toBeFalsy();
				expect(scoped.self?.publicSuspectTokens).toEqual([]);
				expect(scoped.self?.voteConfirmed).toBe(false);
			}
		}

		it('restarts from role-reveal to lobby and keeps room settings', async () => {
			const helper = await SpyGameHelper.create(4);
			await updateSettings(helper.code, helper.hostToken, {
				topic: 'du lịch',
				difficulty: 'hard',
				playtestMode: true,
			});
			await helper.runToRoleReveal();
			const before = await helper.state();
			const versionBefore = before.version;

			const state = await restartRoom(helper.code, helper.hostToken);
			await expectResetToLobby(helper, state);
			expect(state.version).toBeGreaterThan(versionBefore);
			expect(state.topic).toBe('du lịch');
			expect(state.difficulty).toBe('hard');
			expect(state.playtestMode).toBe(true);
			expect(state.name).toBe(before.name);
		});

		it('restarts from opening, discussion, vote, and result', async () => {
			const phases = [
				async (h: SpyGameHelper) => h.runToOpening(),
				async (h: SpyGameHelper) => h.runToDiscussion(),
				async (h: SpyGameHelper) => h.runToVote(),
				async (h: SpyGameHelper) => {
					await h.voteAll({ mode: 'role', vote1: 'spy' });
					return h.finalize();
				},
			] as const;

			for (const advance of phases) {
				const helper = await SpyGameHelper.create(4);
				await advance(helper);
				const state = await restartRoom(helper.code, helper.hostToken);
				await expectResetToLobby(helper, state);
			}
		});

		it('preserves recentWordPairIds after restart', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToRoleReveal();
			const game = await helper.loadGame();
			const recent = [...(game!.recentWordPairIds ?? [])];
			expect(recent.length).toBeGreaterThan(0);

			await restartRoom(helper.code, helper.hostToken);
			const after = await helper.loadGame();
			expect(after!.recentWordPairIds).toEqual(recent);
		});

		it('non-host cannot restart', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToRoleReveal();
			await expect(restartRoom(helper.code, helper.tokens[1]!)).rejects.toMatchObject({
				status: 403,
			});
		});

		it('rejects restart while in lobby', async () => {
			const helper = await SpyGameHelper.create(4);
			await expect(restartRoom(helper.code, helper.hostToken)).rejects.toMatchObject({
				status: 400,
			});
		});

		it('playAgain still resets from result using shared logic', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.voteAll({ mode: 'role', vote1: 'spy' });
			await helper.finalize();
			const state = await playAgain(helper.code, helper.hostToken);
			await expectResetToLobby(helper, state);
		});

		it('guest sees lobby after host restart via state poll', async () => {
			const helper = await SpyGameHelper.create(4);
			await helper.runToDiscussion();
			await restartRoom(helper.code, helper.hostToken);
			const guest = await getScopedState(helper.code, helper.tokens[1]!);
			expect(guest.phase).toBe('lobby');
			expect(guest.isHost).toBe(false);
			expect(guest.playerCount).toBe(4);
		});
	});

	describe('hideRoles mode', () => {
		it('defaults hideRoles to false for new rooms', async () => {
			const host = await createRoom({ name: 'Default', hostName: 'Host' });
			expect(host.hideRoles).toBe(false);
		});

		it('only host can toggle hideRoles in lobby', async () => {
			const helper = await SpyGameHelper.create(4);
			const guest = helper.tokens[1]!;
			await expect(
				updateSettings(helper.code, guest, { hideRoles: true }),
			).rejects.toMatchObject({ status: 403 });

			const updated = await updateSettings(helper.code, helper.hostToken, { hideRoles: true });
			expect(updated.hideRoles).toBe(true);

			await helper.runToRoleReveal();
			await expect(
				updateSettings(helper.code, helper.hostToken, { hideRoles: false }),
			).rejects.toThrow(/SETTINGS_LOBBY_ONLY/);
		});

		it.each([4, 7, 12] as const)(
			'%i players: 1 spy, 0 mrwhite, votesRequired=1',
			async (count) => {
				const helper = await SpyGameHelper.create(count, { hideRoles: true });
				await helper.runToVote();
				const state = await helper.state();
				expect(state.hideRoles).toBe(true);
				expect(state.votesRequired).toBe(1);
				expect(state.phase).toBe('vote');

				const roles: string[] = [];
				for (const t of helper.tokens) {
					const game = await helper.loadGame();
					const p = game!.players.find((x) => x.token === t)!;
					roles.push(p.role!);
					const scoped = await getScopedState(helper.code, t);
					expect(scoped.self?.role).toBeUndefined();
					expect(scoped.self?.teammateName).toBeNull();
					expect(scoped.self?.keyword).toBeTruthy();
					expect(scoped.mrWhite).toBeUndefined();
				}
				expect(roles.filter((r) => r === 'spy')).toHaveLength(1);
				expect(roles.filter((r) => r === 'mrwhite')).toHaveLength(0);
				expect(roles.filter((r) => r === 'civilian')).toHaveLength(count - 1);

				const lean = await SpyGame.findOne({ code: helper.code }).lean();
				expect(lean?.mrWhite?.guessResult).toBe('skipped');
			},
		);

		it('catching spy => civilian win, no mrwhite-guess phase', async () => {
			const helper = await SpyGameHelper.create(7, { hideRoles: true });
			await helper.voteAll({ mode: 'role', vote1: 'spy' });
			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('civilian');
			expect(state.result?.mrWhiteGuessResult).toBe('skipped');
			expect(state.mrWhite).toBeUndefined();
			expect(state.players.every((p) => p.role)).toBe(true);
		});

		it('catching civilian => antagonist win', async () => {
			const helper = await SpyGameHelper.create(7, { hideRoles: true });
			await helper.voteAll({ mode: 'role', vote1: 'civilian' });
			const state = await helper.finalize();
			expect(state.phase).toBe('result');
			expect(state.result?.winningSide).toBe('antagonist');
			expect(state.result?.mrWhiteGuessResult).toBe('skipped');
		});

		it('restart preserves hideRoles setting', async () => {
			const helper = await SpyGameHelper.create(4, { hideRoles: true });
			await helper.runToOpening();
			const restarted = await restartRoom(helper.code, helper.hostToken);
			expect(restarted.phase).toBe('lobby');
			expect(restarted.hideRoles).toBe(true);
		});

		it('normal 7p mode still has mrwhite', async () => {
			const helper = await SpyGameHelper.create(7);
			expect(helper).toBeTruthy();
			await helper.runToRoleReveal();
			const roles: string[] = [];
			for (const t of helper.tokens) {
				const s = await getScopedState(helper.code, t);
				expect(s.hideRoles).toBe(false);
				expect(s.self?.role).toBeTruthy();
				roles.push(s.self!.role!);
			}
			expect(roles).toContain('mrwhite');
			expect(roles.filter((r) => r === 'spy')).toHaveLength(1);
		});
	});
});
