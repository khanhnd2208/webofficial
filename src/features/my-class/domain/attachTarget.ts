export type AttachScope = 'COURSE' | 'LESSON' | 'SECTION';

export type AttachTargetLike = {
	kind: 'test' | 'vocab' | 'knowledge';
	lessonId?: string;
	sectionId?: string;
	scope?: AttachScope;
};

type CourseLabelSource = {
	title: string;
	lessons: Array<{
		id: string;
		title: string;
		sections: Array<{ id: string; title: string }>;
	}>;
};

export function attachTargetLabel(course: CourseLabelSource, target: AttachTargetLike): string {
	if (target.kind === 'vocab') {
		if (!target.lessonId) return 'Toàn khóa';
		return course.lessons.find((lesson) => lesson.id === target.lessonId)?.title ?? 'Bài học';
	}
	if (target.kind === 'knowledge') {
		const lesson = course.lessons.find((item) =>
			item.sections.some((section) => section.id === target.sectionId),
		);
		const section = lesson?.sections.find((item) => item.id === target.sectionId);
		return [lesson?.title, section?.title].filter(Boolean).join(' · ') || 'Chủ đề';
	}
	if (target.scope === 'COURSE' || (!target.lessonId && !target.sectionId)) return 'Toàn khóa';
	const lesson = course.lessons.find((item) => item.id === target.lessonId);
	if (target.scope === 'LESSON' || !target.sectionId) return lesson?.title ?? 'Bài học';
	const section = lesson?.sections.find((item) => item.id === target.sectionId);
	return [lesson?.title, section?.title].filter(Boolean).join(' · ') || 'Chủ đề';
}

export function normalizeTestPlacementBody(
	courseId: string,
	target: AttachTargetLike,
): {
	courseId: string;
	scope: AttachScope;
	lessonId: string | null;
	sectionId: string | null;
} {
	const scope = target.scope;
	if (!scope) throw new Error('Thiếu phạm vi gắn bài kiểm tra');
	if (scope === 'COURSE') {
		return { courseId, scope, lessonId: null, sectionId: null };
	}
	if (scope === 'LESSON') {
		if (!target.lessonId) throw new Error('Test cấp Bài cần chọn bài học');
		return { courseId, scope, lessonId: target.lessonId, sectionId: null };
	}
	if (!target.lessonId || !target.sectionId) {
		throw new Error('Test cấp Chủ đề cần chọn bài và chủ đề');
	}
	return { courseId, scope, lessonId: target.lessonId, sectionId: target.sectionId };
}

type PlacementRow = {
	id: string;
	scope?: string;
	course: { id: string };
	lesson?: { id: string } | null;
	section?: { id: string } | null;
};

export function findPlacementToDetach(
	rows: PlacementRow[],
	courseId: string,
	target?: { lessonId?: string; sectionId?: string; scope?: AttachScope },
): PlacementRow | undefined {
	const inCourse = rows.filter((row) => row.course.id === courseId);
	if (!target) return inCourse.length === 1 ? inCourse[0] : undefined;
	return inCourse.find((row) => {
		if (target.scope === 'COURSE') return row.scope === 'COURSE' || (!row.lesson && !row.section);
		if (target.scope === 'LESSON') {
			return row.lesson?.id === target.lessonId && !row.section;
		}
		if (target.scope === 'SECTION') return row.section?.id === target.sectionId;
		if (target.sectionId) return row.section?.id === target.sectionId;
		if (target.lessonId) return row.lesson?.id === target.lessonId && !row.section;
		return !row.lesson && !row.section;
	});
}

export function isTestAttachedAt(
	placements: Array<{
		scope?: string;
		course?: { id: string };
		lesson?: { id: string } | null;
		section?: { id: string } | null;
	}>,
	courseId: string,
	target: AttachTargetLike,
): boolean {
	return placements.some((placement) => {
		if (placement.course && placement.course.id !== courseId) return false;
		if (target.scope === 'COURSE') {
			return placement.scope === 'COURSE' || (!placement.lesson && !placement.section);
		}
		if (target.scope === 'LESSON') {
			return placement.scope === 'LESSON' && placement.lesson?.id === target.lessonId;
		}
		if (target.scope === 'SECTION') {
			return placement.scope === 'SECTION' && placement.section?.id === target.sectionId;
		}
		return false;
	});
}

export function formatPlacementLabel(placement: {
	lesson?: { title?: string } | null;
	section?: { title?: string } | null;
}): string {
	if (placement.section?.title) {
		return [placement.lesson?.title, placement.section.title].filter(Boolean).join(' · ');
	}
	if (placement.lesson?.title) return placement.lesson.title;
	return 'Toàn khóa';
}

export function isPublishedAuthoring(status?: string | null): boolean {
	return !status || status === 'PUBLISHED';
}
