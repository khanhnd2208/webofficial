import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/appError';
import { updateTeachingClassRecallSchema } from '../schemas';

const mocks = vi.hoisted(() => ({
	getClass: vi.fn(),
	deckFindMany: vi.fn(),
	linkFindMany: vi.fn(),
	transaction: vi.fn(),
	upsert: vi.fn(),
	enablePublishedDecksForClass: vi.fn(),
}));

vi.mock('../repositories/teachingRepository', () => ({
	getClass: mocks.getClass,
	enablePublishedDecksForClass: mocks.enablePublishedDecksForClass,
	prisma: {
		activeRecallDeck: { findMany: mocks.deckFindMany },
		teachingClassRecallDeck: { findMany: mocks.linkFindMany },
		$transaction: mocks.transaction,
	},
}));

import { listClassRecallAssignments, updateClassRecallAssignments } from './recallPlacementService';

describe('class recall enablement', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getClass.mockResolvedValue({ id: 'class-1', courseId: 'course-1' });
		mocks.deckFindMany.mockResolvedValue([
			{
				id: 'deck-hrm',
				slug: 'hrm-lesson-1',
				title: 'HRM Lesson 1',
				lessonLabel: 'Lesson 1',
				status: 'PUBLISHED',
				_count: { cards: 4 },
			},
		]);
		mocks.linkFindMany.mockResolvedValue([]);
		mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
			callback({
				teachingClassRecallDeck: { upsert: mocks.upsert },
			}),
		);
	});

	it('rejects attaching a deck that belongs to another course', async () => {
		await expect(
			updateClassRecallAssignments('class-1', {
				assignments: [{ deckId: 'deck-other', enabled: true, displayOrder: 0 }],
			}),
		).rejects.toMatchObject({
			status: 422,
			message: 'Chỉ có thể gắn bộ thẻ thuộc đúng môn học này',
		} satisfies Partial<AppError>);
		expect(mocks.upsert).not.toHaveBeenCalled();
	});

	it('rejects duplicate deck assignments before they reach the service', () => {
		expect(
			updateTeachingClassRecallSchema.safeParse({
				assignments: [
					{ deckId: 'deck-hrm', enabled: true },
					{ deckId: 'deck-hrm', enabled: false },
				],
			}).success,
		).toBe(false);
	});

	it('toggles and persists enablement for decks of the same course', async () => {
		mocks.linkFindMany.mockResolvedValue([
			{ id: 'link-1', deckId: 'deck-hrm', enabled: true, displayOrder: 0 },
		]);

		const result = await updateClassRecallAssignments('class-1', {
			assignments: [{ deckId: 'deck-hrm', enabled: true, displayOrder: 0 }],
		});

		expect(mocks.upsert).toHaveBeenCalledWith({
			where: { classId_deckId: { classId: 'class-1', deckId: 'deck-hrm' } },
			create: { classId: 'class-1', deckId: 'deck-hrm', enabled: true, displayOrder: 0 },
			update: { enabled: true, displayOrder: 0 },
		});
		expect(result).toEqual([
			expect.objectContaining({
				deckId: 'deck-hrm',
				enabled: true,
				displayOrder: 0,
			}),
		]);
	});

	it('lists course decks as disabled until a class link enables them', async () => {
		const result = await listClassRecallAssignments('class-1');
		expect(result).toEqual([
			expect.objectContaining({
				deckId: 'deck-hrm',
				enabled: false,
				status: 'PUBLISHED',
			}),
		]);
	});

	it('returns decks in the class-specific display order', async () => {
		mocks.deckFindMany.mockResolvedValue([
			{
				id: 'deck-1',
				slug: 'lesson-1',
				title: 'Lesson 1',
				lessonLabel: 'Lesson 1',
				status: 'PUBLISHED',
				_count: { cards: 4 },
			},
			{
				id: 'deck-2',
				slug: 'lesson-2',
				title: 'Lesson 2',
				lessonLabel: 'Lesson 2',
				status: 'PUBLISHED',
				_count: { cards: 5 },
			},
		]);
		mocks.linkFindMany.mockResolvedValue([
			{ id: 'link-1', deckId: 'deck-1', enabled: true, displayOrder: 1 },
			{ id: 'link-2', deckId: 'deck-2', enabled: true, displayOrder: 0 },
		]);

		const result = await listClassRecallAssignments('class-1');

		expect(result.map((item) => item.deckId)).toEqual(['deck-2', 'deck-1']);
	});
});
