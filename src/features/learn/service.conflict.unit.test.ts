import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/appError';

const mocks = vi.hoisted(() => ({
	revisionFindFirst: vi.fn(),
	sectionFindUnique: vi.fn(),
	sectionUpdate: vi.fn(),
	sectionUpdateMany: vi.fn(),
	lessonFindMany: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {
		learnSectionRevision: {
			findFirst: mocks.revisionFindFirst,
			findMany: vi.fn().mockResolvedValue([]),
			create: vi.fn(),
			deleteMany: vi.fn(),
		},
		learnSection: {
			findUnique: mocks.sectionFindUnique,
			update: mocks.sectionUpdate,
			updateMany: mocks.sectionUpdateMany,
		},
		learnLesson: { findMany: mocks.lessonFindMany, update: vi.fn().mockResolvedValue({}) },
		$transaction: mocks.transaction,
	},
}));

import { reorderLearnOutline, updateLearnSection } from './service';

const stamp = '2026-09-25T00:00:00.000Z';
const now = new Date(stamp);

describe('updateLearnSection conflicts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.revisionFindFirst.mockResolvedValue({ createdAt: new Date() });
		mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<void>) => {
			if (typeof run === 'function') await run({});
		});
	});

	it('returns 409 when baseUpdatedAt does not match, and 404 when the section is gone', async () => {
		mocks.sectionUpdateMany.mockResolvedValue({ count: 0 });
		mocks.sectionFindUnique.mockResolvedValue({ id: 's1', type: 'READING' });
		await expect(
			updateLearnSection('s1', { title: 'Mới', baseUpdatedAt: stamp }),
		).rejects.toMatchObject({
			status: 409,
			code: 'SECTION_CONFLICT',
		});

		mocks.sectionFindUnique.mockResolvedValue(null);
		await expect(
			updateLearnSection('s1', { title: 'Mới', baseUpdatedAt: stamp }),
		).rejects.toBeInstanceOf(AppError);
		await expect(
			updateLearnSection('missing', { title: 'Mới', baseUpdatedAt: stamp }),
		).rejects.toMatchObject({ status: 404 });
	});

	it('writes when the timestamp matches and returns the new version', async () => {
		mocks.sectionFindUnique
			.mockResolvedValueOnce({ type: 'READING' })
			.mockResolvedValueOnce({
				type: 'READING',
				durationMinutes: null,
				markdown: 'cũ',
				quiz: null,
				discussion: null,
			})
			.mockResolvedValueOnce({
				id: 's1',
				updatedAt: now,
				estimatedMinutes: 2,
			});
		mocks.sectionUpdateMany.mockResolvedValue({ count: 1 });
		const saved = await updateLearnSection('s1', { markdown: 'mới', baseUpdatedAt: stamp });
		expect(mocks.sectionUpdateMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 's1', updatedAt: now } }),
		);
		expect(saved).toMatchObject({ id: 's1', updatedAt: stamp });
		expect(mocks.sectionUpdate).not.toHaveBeenCalled();
	});
});

describe('reorderLearnOutline', () => {
	it('writes the previous updatedAt back so a reorder is not a content change', async () => {
		mocks.lessonFindMany.mockResolvedValue([
			{ id: 'lesson-1', sections: [{ id: 'section-1', updatedAt: now }] },
		]);
		mocks.transaction.mockImplementation(async (ops: Array<Promise<unknown>>) => Promise.all(ops));
		mocks.sectionUpdate.mockResolvedValue({});
		await reorderLearnOutline('course-1', {
			lessons: [{ id: 'lesson-1', sectionIds: ['section-1'] }],
		});
		expect(mocks.sectionUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ updatedAt: now, position: 0 }),
			}),
		);
	});
});
