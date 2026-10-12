import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	classFindFirst: vi.fn(),
	deckFindFirst: vi.fn(),
	deckFindUnique: vi.fn(),
	deckDelete: vi.fn(),
	linkFindFirst: vi.fn(),
	linkFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {
		teachingClass: { findFirst: mocks.classFindFirst },
		activeRecallDeck: {
			findFirst: mocks.deckFindFirst,
			findUnique: mocks.deckFindUnique,
			delete: mocks.deckDelete,
		},
		teachingClassRecallDeck: {
			findFirst: mocks.linkFindFirst,
			findMany: mocks.linkFindMany,
		},
	},
}));

vi.mock('@/features/teaching/domain/courseIdentity', () => ({
	ensureTeachingCourse: vi.fn(),
	ensureTeachingCourseFromSubject: vi.fn(),
}));

vi.mock('@/features/teaching/services/recallPlacementService', () => ({
	enableDeckForCourseClasses: vi.fn(),
}));

import {
	deleteAdminRecallDeck,
	getPublishedRecallDeckForClass,
	listPublishedRecallDecksForClass,
	resolvePublicClassSlugForDeck,
} from './service';

describe('class-scoped Active Recall queries', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('lists only published decks that are enabled for the class', async () => {
		mocks.linkFindMany.mockResolvedValue([
			{
				deck: {
					id: 'deck-1',
					slug: 'hrm-lesson-1',
					title: 'Lesson 1',
					subject: 'Human Resource Management',
					lessonLabel: 'Lesson 1',
					description: '',
					status: 'PUBLISHED',
					position: 0,
					updatedAt: new Date('2026-09-01T00:00:00.000Z'),
					publishedAt: new Date('2026-09-01T00:00:00.000Z'),
					courseId: 'course-1',
					course: { id: 'course-1', courseCode: 'HRM101', courseName: 'Human Resource Management' },
					_count: { cards: 8 },
				},
			},
		]);

		const decks = await listPublishedRecallDecksForClass('class-1');

		expect(mocks.linkFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					classId: 'class-1',
					enabled: true,
					deck: { status: 'PUBLISHED', cards: { some: {} } },
				},
			}),
		);
		expect(decks).toEqual([
			expect.objectContaining({ slug: 'hrm-lesson-1', courseId: 'course-1' }),
		]);
	});

	it('does not return a draft or disabled deck on the public class player', async () => {
		mocks.classFindFirst.mockResolvedValue({ id: 'class-1', courseId: 'course-1' });
		mocks.deckFindFirst.mockResolvedValue(null);

		await expect(getPublishedRecallDeckForClass('hrm-fall-2026', 'draft-deck')).resolves.toBeNull();
		expect(mocks.deckFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					slug: 'draft-deck',
					courseId: 'course-1',
					status: 'PUBLISHED',
					cards: { some: {} },
					classLinks: { some: { classId: 'class-1', enabled: true } },
				},
			}),
		);
	});

	it('redirects a legacy deck URL to the most recently updated shared class', async () => {
		mocks.linkFindFirst.mockResolvedValue({ class: { publicSlug: 'hrm-spring-2027' } });

		await expect(resolvePublicClassSlugForDeck('hrm-lesson-1')).resolves.toBe('hrm-spring-2027');
		expect(mocks.linkFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					enabled: true,
					deck: { slug: 'hrm-lesson-1', status: 'PUBLISHED', cards: { some: {} } },
					class: { attendanceVisible: true, status: 'ACTIVE', publicSlug: { not: null } },
				},
				orderBy: [{ class: { updatedAt: 'desc' } }, { classId: 'desc' }],
			}),
		);
	});

	it('returns null when no valid public class still has the deck enabled', async () => {
		mocks.linkFindFirst.mockResolvedValue(null);
		await expect(resolvePublicClassSlugForDeck('orphaned-deck')).resolves.toBeNull();
	});
});

describe('admin Active Recall deletion', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes a populated deck and relies on database cascades for cards and class links', async () => {
		mocks.deckFindUnique.mockResolvedValue({
			id: 'deck-1',
			cards: [{ id: 'card-1' }],
			_count: { cards: 8, classLinks: 2 },
		});
		mocks.deckDelete.mockResolvedValue({ id: 'deck-1' });

		await expect(deleteAdminRecallDeck('deck-1')).resolves.toEqual({ id: 'deck-1' });
		expect(mocks.deckDelete).toHaveBeenCalledWith({ where: { id: 'deck-1' } });
	});
});
