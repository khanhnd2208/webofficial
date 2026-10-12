import { compareNaturalText } from '@/lib/naturalSort';

type TeachingClassSortItem = {
	classCode?: string | null;
	courseCode: string;
	groupNo: string;
	term: string;
};

function latestYear(label: string): number {
	const years = label.match(/\b(?:19|20)\d{2}\b/g)?.map(Number) ?? [];
	return years.length ? Math.max(...years) : Number.NEGATIVE_INFINITY;
}

function termNumber(label: string): number {
	const match = label.match(/(?:h[oọ]c\s*k[yỳ]|hk|semester|term)\s*[-:]?\s*(\d+)/iu);
	return match ? Number(match[1]) : Number.NEGATIVE_INFINITY;
}

/** Newest term first, then course and class codes in human numeric order. */
export function compareTeachingClasses(
	left: TeachingClassSortItem,
	right: TeachingClassSortItem,
): number {
	const leftYear = latestYear(left.term);
	const rightYear = latestYear(right.term);
	if (leftYear !== rightYear) return rightYear - leftYear;

	const leftTermNumber = termNumber(left.term);
	const rightTermNumber = termNumber(right.term);
	if (leftTermNumber !== rightTermNumber) return rightTermNumber - leftTermNumber;

	const termLabelOrder = compareNaturalText(right.term, left.term);
	if (termLabelOrder !== 0) return termLabelOrder;

	const courseOrder = compareNaturalText(left.courseCode, right.courseCode);
	if (courseOrder !== 0) return courseOrder;

	return compareNaturalText(left.classCode ?? left.groupNo, right.classCode ?? right.groupNo);
}
