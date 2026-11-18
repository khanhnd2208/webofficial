import { prisma } from '@/lib/prisma';

import { compareRecallDeckTitles } from './deckOrder';
import type { ActiveRecallStudyDeck } from './types';

/**
 * Loaders for "Test yourself": every published deck a learner can open, with
 * its cards, so the learner can pick any mix of decks and let a boss quiz them.
 */

export type RecallTestDeck = ActiveRecallStudyDeck & { slug: string };

export type RecallTestSource = {
	/** Course name, shown as the arena title. */
	title: string;
	decks: RecallTestDeck[];
};

const testDeckSelect = {
	id: true,
	slug: true,
	title: true,
	lessonLabel: true,
	cards: {
		orderBy: { position: 'asc' },
		select: { id: true, question: true, answer: true, questionVi: true, answerVi: true },
	},
} as const;

const publishedWithCards = { status: 'PUBLISHED', cards: { some: {} } } as const;

export async function getRecallTestForCourse(courseId: string): Promise<RecallTestSource | null> {
	const course = await prisma.teachingCourse.findUnique({
		where: { id: courseId, status: 'ACTIVE' },
		select: {
			courseName: true,
			decks: { where: publishedWithCards, select: testDeckSelect },
		},
	});
	if (!course?.decks.length) return null;
	return {
		title: course.courseName,
		decks: course.decks
			.sort((left, right) => compareRecallDeckTitles(left.title, right.title))
			.map((deck) => ({ ...deck, subject: course.courseName })),
	};
}

export async function getRecallTestForClass(classSlug: string): Promise<RecallTestSource | null> {
	const teachingClass = await prisma.teachingClass.findFirst({
		where: { publicSlug: classSlug, attendanceVisible: true, status: 'ACTIVE' },
		select: {
			id: true,
			courseId: true,
			course: { select: { courseName: true } },
		},
	});
	if (!teachingClass) return null;
	const links = await prisma.teachingClassRecallDeck.findMany({
		where: {
			classId: teachingClass.id,
			enabled: true,
			deck: { courseId: teachingClass.courseId, ...publishedWithCards },
		},
		orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
		select: { displayOrder: true, deck: { select: testDeckSelect } },
	});
	if (!links.length) return null;
	const subject = teachingClass.course.courseName;
	return {
		title: subject,
		decks: links
			.sort(
				(left, right) =>
					left.displayOrder - right.displayOrder ||
					compareRecallDeckTitles(left.deck.title, right.deck.title),
			)
			.map(({ deck }) => ({ ...deck, subject })),
	};
}
