/**
 * What this browser remembers about one deck, kept in localStorage under the
 * key the study player has always used, so existing places carry over.
 *
 * - `known`: cards the learner marked "Đã nhớ" in study or "Nhớ được" in a test.
 * - `currentId`: the card to resume on.
 * - `studiedAt`: last time the deck was opened or graded, for "Tiếp tục".
 *
 * Nothing here leaves the device; the lists and the player read it to show
 * progress without an account.
 */
export type DeckProgress = {
	currentId?: string;
	shuffled?: boolean;
	viMode?: boolean;
	splitView?: boolean;
	known?: string[];
	studiedAt?: number;
};

const EVENT = 'active-recall-progress';

export function deckProgressKey(deckId: string) {
	return `active-recall:${deckId}`;
}

export function readDeckProgress(deckId: string): DeckProgress {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(deckProgressKey(deckId)) ?? '{}');
		return value && typeof value === 'object' ? (value as DeckProgress) : {};
	} catch {
		return {};
	}
}

export function writeDeckProgress(deckId: string, patch: Partial<DeckProgress>) {
	try {
		const next = { ...readDeckProgress(deckId), ...patch };
		localStorage.setItem(deckProgressKey(deckId), JSON.stringify(next));
		window.dispatchEvent(new CustomEvent(EVENT, { detail: deckId }));
	} catch {
		// Progress is a convenience; private mode or a full quota just skips it.
	}
}

/** Add or remove one card from the known set and stamp the deck as studied now. */
export function markCardKnown(deckId: string, cardId: string, known: boolean) {
	const current = new Set(readDeckProgress(deckId).known ?? []);
	if (known) current.add(cardId);
	else current.delete(cardId);
	writeDeckProgress(deckId, { known: [...current], studiedAt: Date.now() });
}

export function subscribeDeckProgress(callback: () => void) {
	const onStorage = (event: StorageEvent) => {
		if (!event.key || event.key.startsWith('active-recall:')) callback();
	};
	window.addEventListener(EVENT, callback);
	window.addEventListener('storage', onStorage);
	return () => {
		window.removeEventListener(EVENT, callback);
		window.removeEventListener('storage', onStorage);
	};
}

export type DeckProgressSummary = {
	/** Known cards that still exist in the deck. */
	known: number;
	total: number;
	started: boolean;
	studiedAt: number;
	currentIndex: number;
};

/**
 * Summaries for a list of decks as one string, so useSyncExternalStore gets a
 * stable snapshot; parse it with parseProgressSnapshot.
 */
export function progressSnapshot(decks: readonly { id: string; cardIds?: readonly string[] }[]) {
	return JSON.stringify(
		decks.map((deck) => {
			const stored = readDeckProgress(deck.id);
			const ids = deck.cardIds;
			const known = ids
				? (stored.known ?? []).filter((id) => ids.includes(id)).length
				: (stored.known ?? []).length;
			const currentIndex = ids && stored.currentId ? ids.indexOf(stored.currentId) : -1;
			return [
				deck.id,
				known,
				stored.currentId || stored.studiedAt ? 1 : 0,
				stored.studiedAt ?? 0,
				currentIndex,
			];
		}),
	);
}

export function parseProgressSnapshot(snapshot: string) {
	const map = new Map<string, Omit<DeckProgressSummary, 'total'>>();
	try {
		for (const [id, known, started, studiedAt, currentIndex] of JSON.parse(snapshot) as [
			string,
			number,
			number,
			number,
			number,
		][]) {
			map.set(id, { known, started: started === 1, studiedAt, currentIndex });
		}
	} catch {
		// An empty map renders every deck as not started.
	}
	return map;
}
