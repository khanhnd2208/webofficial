export type StoredTestScore = {
	score: number;
	total: number;
};

function storageKey(courseSlug: string, testSlug: string) {
	return `my-class:test-result:${courseSlug}:${testSlug}`;
}

export function readTestScore(courseSlug: string, testSlug: string): StoredTestScore | null {
	try {
		const raw = localStorage.getItem(storageKey(courseSlug, testSlug));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as StoredTestScore;
		if (typeof parsed.score !== 'number' || typeof parsed.total !== 'number') return null;
		return parsed;
	} catch {
		return null;
	}
}

export function writeTestScore(courseSlug: string, testSlug: string, score: StoredTestScore) {
	try {
		localStorage.setItem(storageKey(courseSlug, testSlug), JSON.stringify(score));
	} catch {
		/* private mode */
	}
}

export function readCourseTestScores(
	courseSlug: string,
	testSlugs: string[],
): Record<string, StoredTestScore> {
	const next: Record<string, StoredTestScore> = {};
	for (const slug of testSlugs) {
		const saved = readTestScore(courseSlug, slug);
		if (saved) next[slug] = saved;
	}
	return next;
}
