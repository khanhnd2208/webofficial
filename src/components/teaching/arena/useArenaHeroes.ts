'use client';

import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { arenaCast, arenaCharacterFor, type ArenaCharacter } from './arenaCharacters';
import type { ArenaProgress } from './arenaGame';
import { balanceHeroes } from './arenaHeroAssign';

/**
 * Today's hero for each student on the floor, spread evenly over the heroes
 * in play and kept in the day's progress so a reload shows the same faces.
 */
export function useArenaHeroes({
	players,
	heroIds,
	progress,
	setProgress,
	ready,
}: {
	players: readonly RecallArenaPlayer[];
	heroIds: readonly string[];
	progress: ArenaProgress;
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	ready: boolean;
}) {
	const cast = useMemo(() => arenaCast(heroIds), [heroIds]);
	const ids = useMemo(() => players.map((player) => player.enrollmentId), [players]);
	// Random, so only after the day's progress is read: the server render and the
	// first client render both use the stable fallback below.
	const assigned = useMemo(
		() =>
			ready
				? balanceHeroes(
						ids,
						cast.map((hero) => hero.id),
						progress.heroes,
					)
				: {},
		[ready, ids, cast, progress.heroes],
	);

	useEffect(() => {
		if (!ready || ids.every((id) => progress.heroes[id] === assigned[id])) return;
		setProgress((previous) => ({ ...previous, heroes: { ...previous.heroes, ...assigned } }));
	}, [ready, ids, assigned, progress.heroes, setProgress]);

	const heroes = useMemo(() => {
		const byId = new Map(cast.map((hero) => [hero.id, hero]));
		return new Map<string, ArenaCharacter>(
			players.map((player) => [
				player.enrollmentId,
				byId.get(assigned[player.enrollmentId] ?? '') ??
					arenaCharacterFor(player.studentCode, heroIds),
			]),
		);
	}, [players, assigned, cast, heroIds]);

	return useCallback(
		(player: Pick<RecallArenaPlayer, 'enrollmentId' | 'studentCode'>) =>
			heroes.get(player.enrollmentId) ?? arenaCharacterFor(player.studentCode, heroIds),
		[heroes, heroIds],
	);
}
