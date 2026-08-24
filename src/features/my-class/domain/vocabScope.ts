export function courseVocabScopeKey(courseId: string, vocabSetId: string) {
	return `course:${courseId}:set:${vocabSetId}`;
}

export function lessonVocabScopeKey(lessonId: string, vocabSetId: string) {
	return `lesson:${lessonId}:set:${vocabSetId}`;
}

export function guessWhoReady(words: Array<{ hintsHard: string[]; hintsMedium: string[]; hintsEasy: string[] }>) {
	return words.some((word) => word.hintsHard.length + word.hintsMedium.length + word.hintsEasy.length > 0);
}

export function isLearnerVisibleVocabAssignment(row: {
	vocabSet: { isArchived: boolean };
	lessonId: string | null;
	lesson: { status?: string | null } | null;
}): boolean {
	if (row.vocabSet.isArchived) return false;
	if (!row.lessonId) return true;
	if (!row.lesson) return false;
	return !row.lesson.status || row.lesson.status === 'PUBLISHED';
}
