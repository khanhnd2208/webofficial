import { AppError } from '@/lib/appError';

import * as repo from '../repositories/teachingRepository';
import type { UpdateTeachingClassRecallInput } from '../schemas';
import type { TeachingClassRecallAssignment } from '../types';

function missingClass(): never {
	throw new AppError('Class not found', 404, 'NOT_FOUND');
}

export async function listClassRecallAssignments(classId: string): Promise<TeachingClassRecallAssignment[]> {
	const teachingClass = await repo.getClass(classId);
	if (!teachingClass) missingClass();
	const decks = await repo.prisma.activeRecallDeck.findMany({
		where: { courseId: teachingClass.courseId },
		orderBy: [{ position: 'asc' }, { title: 'asc' }],
		include: { _count: { select: { cards: true } } },
	});
	const links = await repo.prisma.teachingClassRecallDeck.findMany({
		where: { classId },
	});
	const byDeck = new Map(links.map((link) => [link.deckId, link]));
	return decks
		.map((deck, index) => {
			const link = byDeck.get(deck.id);
			return {
				id: link?.id ?? deck.id,
				deckId: deck.id,
				slug: deck.slug,
				title: deck.title,
				lessonLabel: deck.lessonLabel,
				status: deck.status,
				cardCount: deck._count.cards,
				enabled: link?.enabled ?? false,
				displayOrder: link?.displayOrder ?? index,
			};
		})
		.sort(
			(left, right) =>
				left.displayOrder - right.displayOrder || left.title.localeCompare(right.title, 'vi'),
		);
}

export async function updateClassRecallAssignments(
	classId: string,
	input: UpdateTeachingClassRecallInput,
): Promise<TeachingClassRecallAssignment[]> {
	const teachingClass = await repo.getClass(classId);
	if (!teachingClass) missingClass();
	const courseDecks = await repo.prisma.activeRecallDeck.findMany({
		where: { courseId: teachingClass.courseId },
		select: { id: true },
	});
	const allowed = new Set(courseDecks.map((deck) => deck.id));
	if (input.assignments.some((assignment) => !allowed.has(assignment.deckId))) {
		throw new AppError('Chỉ có thể gắn bộ thẻ thuộc đúng môn học này', 422, 'VALIDATION');
	}
	await repo.prisma.$transaction(async (tx) => {
		for (const [index, assignment] of input.assignments.entries()) {
			await tx.teachingClassRecallDeck.upsert({
				where: { classId_deckId: { classId, deckId: assignment.deckId } },
				create: {
					classId,
					deckId: assignment.deckId,
					enabled: assignment.enabled,
					displayOrder: assignment.displayOrder ?? index,
				},
				update: {
					enabled: assignment.enabled,
					displayOrder: assignment.displayOrder ?? index,
				},
			});
		}
	});
	return listClassRecallAssignments(classId);
}

export async function enablePublishedDecksForClass(classId: string, courseId: string) {
	await repo.enablePublishedDecksForClass(classId, courseId);
}

export async function enableDeckForCourseClasses(courseId: string, deckId: string, displayOrder = 0) {
	const classes = await repo.prisma.teachingClass.findMany({
		where: { courseId },
		select: { id: true },
	});
	if (!classes.length) return;
	await repo.prisma.teachingClassRecallDeck.createMany({
		data: classes.map((teachingClass) => ({
			classId: teachingClass.id,
			deckId,
			enabled: true,
			displayOrder,
		})),
		skipDuplicates: true,
	});
}
