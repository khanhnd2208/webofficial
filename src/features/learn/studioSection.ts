import type { LearnSection } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { readCheckpoint, readDiscussion, readQuiz } from './content';
import type { LearnStudioSection } from './types';

export function mapStudioSection(section: {
	id: string;
	lessonId: string;
	type: LearnSection['type'];
	title: string;
	durationMinutes: number | null;
	estimatedMinutes: number;
	summary: string;
	keyTakeaways: string[];
	markdown: string;
	checkpoint: Prisma.JsonValue;
	quiz: Prisma.JsonValue;
	discussion: Prisma.JsonValue;
	updatedAt: Date;
}): LearnStudioSection {
	return {
		id: section.id,
		lessonId: section.lessonId,
		type: section.type,
		title: section.title,
		durationMinutes: section.durationMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		quiz: readQuiz(section.quiz),
		discussion: readDiscussion(section.discussion),
		estimatedMinutes: section.estimatedMinutes,
		updatedAt: section.updatedAt.toISOString(),
	};
}
