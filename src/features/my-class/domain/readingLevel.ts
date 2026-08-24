import { hasHtmlContent } from './normalize';

export type ReadingLevel = 'readable' | 'academic' | 'deep';

export const READING_LEVEL_ORDER: ReadingLevel[] = ['readable', 'academic', 'deep'];

export const READING_LEVEL_LABEL: Record<ReadingLevel, string> = {
	readable: 'Dễ hiểu',
	academic: 'Học thuật',
	deep: 'Chuyên sâu',
};

export const READING_LEVEL_HINT: Record<ReadingLevel, string> = {
	readable: 'Ý chính, ít thuật ngữ',
	academic: 'Đúng ngôn ngữ môn học',
	deep: 'Phân tích và liên hệ',
};

export const READING_LEVEL_STORAGE_KEY = 'my-class:reading-level';

export function toReadingLevel(db: 'FOUNDATION' | 'ACADEMIC' | 'EXPERT'): ReadingLevel {
	if (db === 'FOUNDATION') return 'readable';
	if (db === 'EXPERT') return 'deep';
	return 'academic';
}

export function toDbLevel(level: ReadingLevel): 'FOUNDATION' | 'ACADEMIC' | 'EXPERT' {
	if (level === 'readable') return 'FOUNDATION';
	if (level === 'deep') return 'EXPERT';
	return 'ACADEMIC';
}

export function availableReadingLevels(revision: {
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
}): ReadingLevel[] {
	const levels: ReadingLevel[] = [];
	if (hasHtmlContent(revision.foundationHtml)) levels.push('readable');
	if (hasHtmlContent(revision.academicHtml)) levels.push('academic');
	if (hasHtmlContent(revision.expertHtml)) levels.push('deep');
	return levels;
}

export function resolveReadingLevel(
	preferred: ReadingLevel | null | undefined,
	available: ReadingLevel[],
): ReadingLevel | null {
	if (preferred && available.includes(preferred)) return preferred;
	return READING_LEVEL_ORDER.find((level) => available.includes(level)) ?? null;
}

export function htmlForReadingLevel(
	revision: { foundationHtml: string; academicHtml: string; expertHtml: string },
	level: ReadingLevel,
): string {
	if (level === 'readable') return revision.foundationHtml;
	if (level === 'deep') return revision.expertHtml;
	return revision.academicHtml;
}
