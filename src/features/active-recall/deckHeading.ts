const LESSON_PATTERN =
	/^(?:(.+?)\s*[-–—:|·]\s*)?(?:lecture|lesson|bài|chương|chapter|unit|week|tuần)\s*0*(\d+)\s*(?:[-–—:.|·]\s*)?(.*)$/i;

export type DeckHeading = {
	/** Lesson number as text ("1", "12"), or null when neither title nor label has one. */
	number: string | null;
	/** Title without the course prefix and "Lesson N". */
	title: string;
};

/**
 * "HRM - Lesson 3 - Planning for and Recruiting" becomes { number: "3", title:
 * "Planning for and Recruiting" }, so a list shows the number once in its own
 * column instead of repeating "HRM - Lesson" on every row. A title without a
 * lesson number keeps its full text and may take the number from the label.
 */
export function parseDeckHeading(title: string, lessonLabel = ''): DeckHeading {
	const clean = title.trim();
	const match = LESSON_PATTERN.exec(clean);
	if (match && match[3]?.trim()) return { number: match[2] ?? null, title: match[3].trim() };
	const labelNumber = /(\d+)/.exec(lessonLabel)?.[1] ?? null;
	return { number: labelNumber, title: clean };
}
