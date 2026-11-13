import { compareNaturalText } from '@/lib/naturalSort';

function normalizeNumberSpacing(title: string) {
	return title.replace(/(\p{L})\s+(?=\d)/gu, '$1');
}

export function compareRecallDeckTitles(left: string, right: string) {
	return compareNaturalText(normalizeNumberSpacing(left), normalizeNumberSpacing(right));
}
