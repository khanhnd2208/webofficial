import type { LearnSection, Prisma } from '@prisma/client';

import { readCheckpoint, readDiscussion } from './content';
import type { LearnSectionKind, LearnStudioSection } from './types';

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
	discussion: Prisma.JsonValue;
	updatedAt: Date;
}): LearnStudioSection {
	return {
		id: section.id,
		lessonId: section.lessonId,
		// Queries only load READING and DISCUSSION rows (see `liveSection` in service.ts).
		type: section.type as LearnSectionKind,
		title: section.title,
		durationMinutes: section.durationMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways,
		markdown: section.markdown,
		checkpoint: readCheckpoint(section.checkpoint),
		discussion: readDiscussion(section.discussion),
		estimatedMinutes: section.estimatedMinutes,
		updatedAt: section.updatedAt.toISOString(),
	};
}
