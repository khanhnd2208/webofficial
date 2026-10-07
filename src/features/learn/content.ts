import { learnCheckpointSchema, learnDiscussionSchema } from './schemas';
import type { LearnCheckpoint, LearnDiscussion, LearnSectionKind } from './types';

/** Deep reading of academic prose runs slower than skimming. */
const WORDS_PER_MINUTE = 180;

export function countWords(markdown: string): number {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/[#>*_`|[\]()-]/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length;
}

/** Tidy editor output: drop empty-paragraph `&nbsp;` lines and runs of blank lines. */
export function normalizeEditorMarkdown(markdown: string): string {
	return markdown
		.split('\n')
		.filter((line) => line.trim() !== '&nbsp;')
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function estimateReadingMinutes(markdown: string): number {
	return Math.max(1, Math.round(countWords(markdown) / WORDS_PER_MINUTE));
}

export function sectionMinutes(section: {
	type: LearnSectionKind;
	durationMinutes: number | null;
	markdown: string;
	discussion?: LearnDiscussion | null;
}): number {
	if (section.durationMinutes) return section.durationMinutes;
	if (section.type === 'DISCUSSION') {
		// The intro (how to use the questions) is read once, then every question and answer.
		const text = [
			section.markdown,
			...(section.discussion?.questions ?? []).map((item) => `${item.question}\n${item.answer}`),
		].join('\n');
		return estimateReadingMinutes(text);
	}
	return estimateReadingMinutes(section.markdown);
}

export function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

/** JSON columns are written through zod, but read defensively in case of manual edits. */
export function readCheckpoint(value: unknown): LearnCheckpoint | null {
	if (!value) return null;
	const parsed = learnCheckpointSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function readDiscussion(value: unknown): LearnDiscussion | null {
	if (!value) return null;
	const parsed = learnDiscussionSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function newQuestionId(): string {
	return `q_${Math.random().toString(36).slice(2, 10)}`;
}
