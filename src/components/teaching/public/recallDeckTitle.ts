const LESSON_PATTERN =
	/^(?:(.+?)\s*[-–—:|]\s*)?(?:lecture|lesson|bài|chương|chapter|unit|week|tuần)\s*0*(\d+)\s*(?:[-–—:.|]\s*)?(.*)$/i;

export interface DeckHeading {
	/** Lesson number as text ("1", "12"), or null when the title has none. */
	number: string | null;
	/** Title with the course prefix and "Lecture N" removed. */
	title: string;
}

/**
 * "HRM - Lecture 3 - Planning for and Recruiting" becomes { number: "3", title:
 * "Planning for and Recruiting" }, so a list can show the number once in its own
 * column instead of repeating "HRM - Lecture" on every row. Titles without a lesson
 * number keep their full text and may borrow the number from the lesson label.
 */
export function parseDeckTitle(title: string, lessonLabel = ''): DeckHeading {
	const clean = title.trim();
	const match = LESSON_PATTERN.exec(clean);
	if (match && match[3]?.trim()) return { number: match[2] ?? null, title: match[3].trim() };
	const labelNumber = /(\d+)/.exec(lessonLabel)?.[1] ?? null;
	return { number: labelNumber, title: clean };
}
