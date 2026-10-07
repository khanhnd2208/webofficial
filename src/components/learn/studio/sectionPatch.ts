import { updateLearnSectionSchema } from '@/features/learn/schemas';
import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

export type SectionPatch = Partial<
	Pick<
		LearnStudioSection,
		'title' | 'type' | 'durationMinutes' | 'summary' | 'keyTakeaways' | 'markdown' | 'discussion'
	>
>;

export type SectionFieldErrors = Record<string, string>;

export function findSection(
	lessons: LearnStudioLesson[],
	id: string | null,
): LearnStudioSection | null {
	if (!id) return null;
	for (const lesson of lessons) {
		const match = lesson.sections.find((section) => section.id === id);
		if (match) return match;
	}
	return null;
}

function issueField(path: ReadonlyArray<PropertyKey>): string {
	const head = path[0];
	return typeof head === 'string' || typeof head === 'number' ? String(head) : '';
}

/**
 * Turn a local edit into a body the section API will accept.
 * Invalid fields are omitted and reported so one bad field cannot block the rest.
 */
export function validateSectionPatch(patch: SectionPatch): {
	body: Record<string, unknown>;
	errors: SectionFieldErrors;
} {
	const errors: SectionFieldErrors = {};
	const candidate: Record<string, unknown> = {};

	if ('title' in patch && typeof patch.title === 'string' && patch.title.trim() === '') {
		errors.title = 'Tên mục không được để trống';
	}

	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) continue;
		if (key === 'title' && errors.title) continue;
		if (key === 'keyTakeaways' && Array.isArray(value)) {
			candidate.keyTakeaways = value.map((item) => item.trim()).filter(Boolean);
			continue;
		}
		candidate[key] = value;
	}

	let remaining = candidate;
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const parsed = updateLearnSectionSchema.safeParse(remaining);
		if (parsed.success) return { body: parsed.data, errors };

		let removed = false;
		for (const issue of parsed.error.issues) {
			const field = issueField(issue.path);
			if (!field || !(field in remaining)) continue;
			if (!errors[field]) errors[field] = issue.message;
			delete remaining[field];
			removed = true;
		}
		if (!removed) break;
		remaining = { ...remaining };
	}

	return { body: remaining, errors };
}

/** Body actually sent to the API. Blank titles and empty takeaway rows stay local. */
export function networkPatch(patch: SectionPatch): Record<string, unknown> {
	return validateSectionPatch(patch).body;
}
