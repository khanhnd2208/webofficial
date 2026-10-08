/**
 * Class pages a visitor opened on this device, newest first. Students reach a class only through
 * the link their lecturer shares, so My Space can offer it again.
 */
export const RECENT_CLASSES_KEY = 'recent-classes:v1';
const LIMIT = 4;

export type RecentClass = { slug: string; title: string; code: string; visitedAt: number };

function isRecentClass(value: unknown): value is RecentClass {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.slug === 'string' &&
		typeof entry.title === 'string' &&
		typeof entry.code === 'string' &&
		typeof entry.visitedAt === 'number'
	);
}

export function readRecentClasses(raw: string | null): RecentClass[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isRecentClass).slice(0, LIMIT) : [];
	} catch {
		return [];
	}
}

export function withRecentClass(list: RecentClass[], visit: RecentClass): RecentClass[] {
	return [visit, ...list.filter((entry) => entry.slug !== visit.slug)].slice(0, LIMIT);
}
