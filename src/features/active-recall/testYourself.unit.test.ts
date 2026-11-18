import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	classFindFirst: vi.fn(),
	courseFindUnique: vi.fn(),
	linkFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
	prisma: {
		teachingClass: { findFirst: mocks.classFindFirst },
		teachingCourse: { findUnique: mocks.courseFindUnique },
		teachingClassRecallDeck: { findMany: mocks.linkFindMany },
	},
}));

import { getRecallTestForClass, getRecallTestForCourse } from './testYourself';

const card = { id: 'c1', question: 'Q', answer: 'A', questionVi: '', answerVi: '' };
const deck = (id: string, title: string) => ({
	id,
	slug: id,
	title,
	lessonLabel: title,
	cards: [card],
});

describe('Test yourself loaders', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads every published course deck with its cards, in title order', async () => {
		mocks.courseFindUnique.mockResolvedValue({
			courseName: 'HRM',
			decks: [deck('d10', 'Lesson 10'), deck('d2', 'Lesson 2')],
		});

		const source = await getRecallTestForCourse('course-1');

		expect(mocks.courseFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 'course-1', status: 'ACTIVE' } }),
		);
		expect(source?.title).toBe('HRM');
		expect(source?.decks.map((item) => item.id)).toEqual(['d2', 'd10']);
		expect(source?.decks[0]).toMatchObject({ subject: 'HRM', cards: [card] });
	});

	it('returns null for a course without published decks', async () => {
		mocks.courseFindUnique.mockResolvedValue({ courseName: 'HRM', decks: [] });
		await expect(getRecallTestForCourse('course-1')).resolves.toBeNull();
	});

	it('loads only decks enabled for a public class', async () => {
		mocks.classFindFirst.mockResolvedValue({
			id: 'class-1',
			courseId: 'course-1',
			course: { courseName: 'HRM' },
		});
		mocks.linkFindMany.mockResolvedValue([
			{ displayOrder: 1, deck: deck('d1', 'Lesson 1') },
			{ displayOrder: 0, deck: deck('d3', 'Lesson 3') },
		]);

		const source = await getRecallTestForClass('hrm-fall');

		expect(mocks.classFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { publicSlug: 'hrm-fall', attendanceVisible: true, status: 'ACTIVE' },
			}),
		);
		expect(mocks.linkFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					classId: 'class-1',
					enabled: true,
					deck: { courseId: 'course-1', status: 'PUBLISHED', cards: { some: {} } },
				},
			}),
		);
		expect(source?.decks.map((item) => item.id)).toEqual(['d3', 'd1']);
	});

	it('returns null for a hidden class', async () => {
		mocks.classFindFirst.mockResolvedValue(null);
		await expect(getRecallTestForClass('hidden')).resolves.toBeNull();
		expect(mocks.linkFindMany).not.toHaveBeenCalled();
	});
});
