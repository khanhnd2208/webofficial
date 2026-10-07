/** Standalone review blocks that are no longer part of a lecture. */
const RETIRED_HEADINGS = [
	'câu hỏi tự kiểm tra',
	'câu hỏi luyện tập',
	'bài tập thực hành',
	'bài tập thực hành trong tuần',
] as const;

const UNCLEAR_HEADING = /kiểm tra|kiem tra|thực hành|thuc hanh|luyện tập|luyen tap/i;

export function normalizePracticeHeading(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/^\d+(?:\.\d+)*[.)]\s*/, '')
		.replace(/[:：.\s]+$/g, '')
		.trim();
}

export function isRetiredPracticeHeading(title: string): boolean {
	const normalized = normalizePracticeHeading(title);
	return RETIRED_HEADINGS.some((heading) => normalized === heading);
}

function fenceChange(line: string, fence: string | null): string | null {
	const match = line.trim().match(/^(`{3,}|~{3,})(.*)$/);
	if (!match) return fence;
	if (!fence) return match[1];
	const closes = match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim();
	return closes ? null : fence;
}

/**
 * Drop a retired practice heading and everything under it until the next heading of the
 * same or higher level. Headings inside a code fence stay untouched.
 */
export function stripRetiredPracticeBlocks(markdown: string): {
	markdown: string;
	removed: string[];
} {
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const kept: string[] = [];
	const removed: string[] = [];
	let fence: string | null = null;
	let skipping = false;
	let skipUntilLevel = 0;

	for (const line of lines) {
		const nextFence = fenceChange(line, fence);
		const inFence = Boolean(fence);
		fence = nextFence;
		if (!inFence) {
			const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
			if (heading) {
				const level = heading[1].length;
				const title = heading[2].trim();
				if (skipping && level <= skipUntilLevel) skipping = false;
				if (!skipping && isRetiredPracticeHeading(title)) {
					removed.push(title);
					skipping = true;
					skipUntilLevel = level;
					continue;
				}
			}
		}
		if (!skipping) kept.push(line);
	}

	return {
		markdown: kept
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim(),
		removed,
	};
}

/** Headings that mention practice but are not one of the blocks removed automatically. */
export function unclearPracticeHeadings(markdown: string): string[] {
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const found: string[] = [];
	let fence: string | null = null;
	for (const line of lines) {
		const nextFence = fenceChange(line, fence);
		const inFence = Boolean(fence);
		fence = nextFence;
		if (inFence) continue;
		const heading = line.match(/^#{1,2}\s+(.+?)\s*#*\s*$/);
		if (!heading) continue;
		const title = heading[1].trim();
		if (!UNCLEAR_HEADING.test(title) || isRetiredPracticeHeading(title)) continue;
		found.push(title);
	}
	return found;
}
