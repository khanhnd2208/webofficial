'use client';

import { useMemo, type Dispatch, type SetStateAction } from 'react';

import { recallVisibleText } from '@/features/active-recall/richText';
import type { RecallArenaData } from '@/features/teaching/types';

import {
	hiddenArenaCards,
	keptArenaCards,
	type ArenaCardFate,
	type ArenaHistoryEntry,
	type ArenaProgress,
} from './arenaGame';

/** Today's question pool: the chosen lessons' cards, minus the ones hidden so far. */
export function useArenaQuestions(
	data: RecallArenaData,
	deckIds: readonly string[],
	history: readonly ArenaHistoryEntry[],
	setProgress: Dispatch<SetStateAction<ArenaProgress>>,
) {
	const cards = useMemo(() => {
		const active = new Set(deckIds);
		return data.cards.filter((card) => active.has(card.deckId));
	}, [data.cards, deckIds]);
	const hidden = useMemo(() => hiddenArenaCards(history), [history]);
	const kept = useMemo(() => keptArenaCards(history), [history]);
	const availableIds = useMemo(
		() => cards.map((card) => card.id).filter((id) => !hidden.has(id)),
		[cards, hidden],
	);
	const byId = useMemo(() => new Map(data.cards.map((card) => [card.id, card])), [data.cards]);
	/** A turn's question as plain text, for the history list. */
	function questionText(cardId: string | null) {
		const card = cardId ? byId.get(cardId) : null;
		return card ? recallVisibleText(card.question) : 'Câu hỏi riêng';
	}
	/** Hide or bring back a question after grading, from the history panel. */
	function setFate(entryId: string, fate: ArenaCardFate) {
		setProgress((previous) => ({
			...previous,
			history: previous.history.map((item) =>
				item.id === entryId ? { ...item, card: fate } : item,
			),
		}));
	}
	return { cards, hidden, kept, availableIds, byId, questionText, setFate };
}
