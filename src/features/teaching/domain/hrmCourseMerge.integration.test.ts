import type { Prisma } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma } from '@/test/helpers/db.postgres';

import { HRM_COURSE_CODE, HRM_COURSE_NAME } from './courseIdentity';

class Rollback extends Error {
	constructor() {
		super('rollback');
		this.name = 'Rollback';
	}
}

async function createDeck(
	tx: Prisma.TransactionClient,
	input: {
		courseId: string;
		slug: string;
		title: string;
		status: 'PUBLISHED' | 'ARCHIVED';
		cardCount: number;
		subject: string;
	},
) {
	return tx.activeRecallDeck.create({
		data: {
			slug: input.slug,
			title: input.title,
			courseId: input.courseId,
			subject: input.subject,
			lessonLabel: input.title,
			status: input.status,
			publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
			cards: {
				create: Array.from({ length: input.cardCount }, (_, index) => ({
					question: `<p>Q ${input.slug} ${index + 1}</p>`,
					answer: `<p>A ${input.slug} ${index + 1}</p>`,
					position: index,
				})),
			},
		},
		include: { cards: { select: { id: true } } },
	});
}

describe('HRM course merge migration', () => {
	afterAll(async () => {
		await disconnectTestPrisma();
	});

	it('attaches VPS-like HRM classes and decks onto 61MGT3HRM without changing card ids', async () => {
		try {
			await prisma.$transaction(
				async (tx) => {
					const suffix = `merge-${Date.now().toString(36)}`;
					const hrmCourse = await tx.teachingCourse.upsert({
						where: { courseCode: HRM_COURSE_CODE },
						update: {},
						create: { courseCode: HRM_COURSE_CODE, courseName: HRM_COURSE_NAME },
					});

					const classes = await Promise.all(
						['M1', 'M2', 'M3', 'M4'].map((groupNo) =>
							tx.teachingClass.create({
								data: {
									courseId: hrmCourse.id,
									courseCode: HRM_COURSE_CODE,
									courseName: hrmCourse.courseName,
									groupNo: `${groupNo}-${suffix}`.slice(0, 20),
									classCode: `${groupNo}-${suffix}`.slice(0, 20),
									term: `Merge ${suffix}`,
								},
							}),
						),
					);

					const hrm101 = await tx.teachingCourse.create({
						data: {
							courseCode: `X-${suffix}`.slice(0, 20),
							courseName: 'Human Resource Management',
						},
					});
					const leftover = await tx.teachingCourse.create({
						data: {
							courseCode: `Y-${suffix}`.slice(0, 20),
							courseName: 'Human Resources Management',
						},
					});

					const published = [
						await createDeck(tx, {
							courseId: hrm101.id,
							slug: `hrm-l1-${suffix}`,
							title: 'Lesson 1',
							status: 'PUBLISHED',
							cardCount: 40,
							subject: 'Human Resource Management',
						}),
						await createDeck(tx, {
							courseId: leftover.id,
							slug: `hrm-l2-${suffix}`,
							title: 'Lesson 2',
							status: 'PUBLISHED',
							cardCount: 40,
							subject: 'Human Resources Management',
						}),
						await createDeck(tx, {
							courseId: leftover.id,
							slug: `hrm-l3-${suffix}`,
							title: 'Lesson 3',
							status: 'PUBLISHED',
							cardCount: 40,
							subject: 'Human Resources Management',
						}),
						await createDeck(tx, {
							courseId: hrm101.id,
							slug: `hrm-l4-${suffix}`,
							title: 'Lesson 4',
							status: 'PUBLISHED',
							cardCount: 39,
							subject: 'Human Resource Management',
						}),
					];
					const archived = [
						await createDeck(tx, {
							courseId: leftover.id,
							slug: `hrm-a1-${suffix}`,
							title: 'Archived 1',
							status: 'ARCHIVED',
							cardCount: 10,
							subject: 'Human Resources Management',
						}),
						await createDeck(tx, {
							courseId: hrm101.id,
							slug: `hrm-a2-${suffix}`,
							title: 'Archived 2',
							status: 'ARCHIVED',
							cardCount: 10,
							subject: 'Human Resource Management',
						}),
					];

					const cardIds = [...published, ...archived]
						.flatMap((deck) => deck.cards.map((card) => card.id))
						.sort();
					expect(cardIds).toHaveLength(179);

					await tx.$executeRaw`SELECT teaching_merge_hrm_courses()`;
					await tx.$executeRaw`SELECT teaching_merge_hrm_courses()`;

					expect(
						await tx.teachingCourse.findUnique({ where: { id: hrm101.id } }),
					).toBeNull();
					expect(
						await tx.teachingCourse.findUnique({ where: { id: leftover.id } }),
					).toBeNull();

					const movedDecks = await tx.activeRecallDeck.findMany({
						where: { slug: { in: [...published, ...archived].map((deck) => deck.slug) } },
						include: { cards: { select: { id: true } }, _count: { select: { cards: true } } },
					});
					expect(movedDecks).toHaveLength(6);
					expect(movedDecks.every((deck) => deck.courseId === hrmCourse.id)).toBe(true);
					expect(movedDecks.filter((deck) => deck.status === 'PUBLISHED')).toHaveLength(4);
					expect(movedDecks.filter((deck) => deck.status === 'ARCHIVED')).toHaveLength(2);
					expect(movedDecks.reduce((sum, deck) => sum + deck._count.cards, 0)).toBe(179);
					expect(movedDecks.flatMap((deck) => deck.cards.map((card) => card.id)).sort()).toEqual(
						cardIds,
					);

					const enabledLinks = await tx.teachingClassRecallDeck.count({
						where: {
							enabled: true,
							classId: { in: classes.map((item) => item.id) },
							deckId: { in: published.map((deck) => deck.id) },
						},
					});
					expect(enabledLinks).toBe(16);

					const archivedLinks = await tx.teachingClassRecallDeck.count({
						where: { deckId: { in: archived.map((deck) => deck.id) } },
					});
					expect(archivedLinks).toBe(0);

					throw new Rollback();
				},
				{ timeout: 30_000, maxWait: 10_000 },
			);
		} catch (error) {
			if (!(error instanceof Rollback) && (error as { name?: string }).name !== 'Rollback') {
				throw error;
			}
		}
	});
});
