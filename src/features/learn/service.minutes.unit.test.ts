import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	revisionFindFirst: vi.fn(),
	sectionFindUnique: vi.fn(),
	sectionUpdate: vi.fn(),
	courseFindUnique: vi.fn(),
	lessonAggregate: vi.fn(),
	lessonCreate: vi.fn(),
	lessonFindFirst: vi.fn(),
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
			create: vi.fn(),
		},
		learnCourse: { findUnique: mocks.courseFindUnique },
		learnLesson: {
			aggregate: mocks.lessonAggregate,
			create: mocks.lessonCreate,
			findFirst: mocks.lessonFindFirst,
		},
		$transaction: mocks.transaction,
	},
}));

import { importLearnMarkdown, restoreSectionRevision, updateLearnSection } from './service';

const now = new Date('2026-09-25T04:00:00.000Z');

describe('stored estimatedMinutes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.revisionFindFirst.mockResolvedValue({ createdAt: now });
		mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<void>) => {
			if (typeof run === 'function') {
				await run({
					learnSectionRevision: {
						create: vi.fn(),
						findMany: vi.fn().mockResolvedValue([]),
						deleteMany: vi.fn(),
					},
					learnSection: { update: mocks.sectionUpdate, create: vi.fn(), deleteMany: vi.fn() },
				});
			}
		});
	});

	it('recomputes minutes when markdown, quiz, or discussion changes', async () => {
		mocks.sectionFindUnique.mockResolvedValue({
			type: 'READING',
			durationMinutes: null,
			markdown: 'cũ',
			quiz: null,
			discussion: null,
		});
		mocks.sectionUpdate.mockImplementation(
			async ({ data }: { data: { estimatedMinutes: number } }) => ({
				id: 's1',
				updatedAt: now,
				estimatedMinutes: data.estimatedMinutes,
			}),
		);

		const reading = await updateLearnSection('s1', { markdown: 'một hai ba bốn năm' });
		expect(reading).toMatchObject({ id: 's1', estimatedMinutes: 1 });

		mocks.sectionFindUnique.mockResolvedValue({
			type: 'QUIZ',
			durationMinutes: null,
			markdown: '',
			quiz: null,
			discussion: null,
		});
		const quiz = await updateLearnSection('s1', {
			quiz: {
				passingScorePercent: 70,
				timeLimitMinutes: null,
				questions: [
					{ id: 'a', question: 'Q', options: ['1', '2'], correctIndex: 0, explanation: '' },
					{ id: 'b', question: 'Q2', options: ['1', '2'], correctIndex: 1, explanation: '' },
				],
			},
		});
		expect(quiz).toMatchObject({ estimatedMinutes: 2 });

		mocks.sectionFindUnique.mockResolvedValue({
			type: 'DISCUSSION',
			durationMinutes: null,
			markdown: '',
			quiz: null,
			discussion: null,
		});
		const discussion = await updateLearnSection('s1', {
			discussion: { questions: [{ id: 'd1', question: 'Vì sao?', answer: 'Vì vậy.' }] },
		});
		expect(discussion).toMatchObject({ estimatedMinutes: 1 });
		expect(mocks.sectionUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ select: { id: true, updatedAt: true, estimatedMinutes: true } }),
		);
	});

	it('stores minutes from an imported section and a restored revision', async () => {
		mocks.courseFindUnique.mockResolvedValue({ id: 'course-1' });
		mocks.lessonAggregate.mockResolvedValue({ _max: { position: 0 } });
		mocks.lessonCreate.mockImplementation(
			async ({ data }: { data: { sections: { create: { estimatedMinutes: number }[] } } }) => ({
				id: 'lesson-1',
				title: data && 'Bài',
				description: '',
				sections: data.sections.create.map((section, index) => ({
					...section,
					id: `sec-${index}`,
					lessonId: 'lesson-1',
					checkpoint: null,
					quiz: null,
					discussion: null,
					updatedAt: now,
				})),
			}),
		);

		const imported = await importLearnMarkdown('course-1', {
			mode: 'create',
			markdown: ['# Bài mới', '', '=== SECTION: Khái niệm | 6 phút ===', '', 'Nội dung.'].join(
				'\n',
			),
		});
		expect(imported[0]?.sections[0]?.estimatedMinutes).toBe(6);

		mocks.sectionFindUnique.mockResolvedValue({ type: 'READING', durationMinutes: null });
		mocks.sectionUpdate.mockImplementation(
			async ({ data }: { data: { estimatedMinutes: number; markdown: string } }) => ({
				id: 's1',
				lessonId: 'lesson-1',
				type: 'READING',
				title: 'Khái niệm',
				durationMinutes: null,
				estimatedMinutes: data.estimatedMinutes,
				summary: '',
				keyTakeaways: [],
				markdown: data.markdown,
				checkpoint: null,
				quiz: null,
				discussion: null,
				updatedAt: now,
			}),
		);
		const { prisma } = await import('@/lib/prisma');
		vi.mocked(prisma.learnSectionRevision.findFirst).mockResolvedValue({
			id: 'rev-1',
			sectionId: 's1',
			title: 'Khái niệm',
			summary: '',
			markdown: Array.from({ length: 400 }, (_, index) => `từ${index}`).join(' '),
			keyTakeaways: [],
			checkpoint: null,
			quiz: null,
			discussion: null,
			reason: 'autosave',
			createdAt: now,
		} as never);

		const restored = await restoreSectionRevision('s1', 'rev-1');
		expect(restored.estimatedMinutes).toBe(2);
		expect(restored.markdown.startsWith('từ0')).toBe(true);
	});
});
