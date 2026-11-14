'use client';

import { useMemo } from 'react';

import { recallVisibleText } from '@/features/active-recall/richText';
import type { RecallArenaData } from '@/features/teaching/types';

import { passedArenaCards, type ArenaHistoryEntry } from './arenaGame';

/** Today's question pool: the chosen lessons' cards, minus the ones already used up. */
export function useArenaQuestions(
	data: RecallArenaData,
	deckIds: readonly string[],
	history: readonly ArenaHistoryEntry[],
) {
	const cards = useMemo(() => {
		const active = new Set(deckIds);
		return data.cards.filter((card) => active.has(card.deckId));
	}, [data.cards, deckIds]);
	const passed = useMemo(() => passedArenaCards(history), [history]);
	const availableIds = useMemo(
		() => cards.map((card) => card.id).filter((id) => !passed.has(id)),
		[cards, passed],
	);
	const byId = useMemo(() => new Map(data.cards.map((card) => [card.id, card])), [data.cards]);
	/** A turn's question as plain text, for the history list. */
	function questionText(cardId: string | null) {
		const card = cardId ? byId.get(cardId) : null;
		return card ? recallVisibleText(card.question) : 'Câu hỏi riêng';
	}
	return { cards, passed, availableIds, byId, questionText };
}
