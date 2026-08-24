export function placementKey(input: {
	testId: string;
	courseId: string;
	lessonId?: string | null;
	sectionId?: string | null;
}): string {
	return `${input.testId}:${input.courseId}:${input.lessonId ?? '-'}:${input.sectionId ?? '-'}`;
}
