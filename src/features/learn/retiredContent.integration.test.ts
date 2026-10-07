import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listLearnCoursesForAdmin } from './adminCatalog';
import { updateLearnSectionSchema } from './schemas';
import {
	getLearnStudioSection,
	listSectionRevisions,
	restoreSectionRevision,
} from './sectionRevisions';
import { updateLearnSection } from './service';

describe('retired Learn content', () => {
	const ids: string[] = [];
	afterEach(async () => {
		await prisma.learnCourse.deleteMany({ where: { id: { in: ids.splice(0) } } });
	});
	async function fixture() {
		const course = await prisma.learnCourse.create({
			data: {
				slug: `retired-review-${randomUUID()}`,
				title: 'Retirement regression',
				lessons: {
					create: {
						title: 'Bài thử',
						sections: {
							create: [
								{ title: 'Bài giảng', type: 'READING', markdown: 'Giảng hiện tại.' },
								{
									title: 'Phản biện',
									type: 'DISCUSSION',
									discussion: { questions: [{ id: 'q1', question: 'Hỏi', answer: 'Đáp' }] },
								},
								{ title: 'Quiz cũ', type: 'QUIZ', quiz: { questions: [{ id: 'legacy' }] } },
								{ title: 'Practice cũ', type: 'PRACTICE' },
							],
						},
					},
				},
			},
			include: { lessons: { include: { sections: true } } },
		});
		ids.push(course.id);
		return { course, sections: course.lessons[0].sections };
	}
	it('excludes legacy types from direct reads, writes, revisions and admin counts', async () => {
		const { course, sections } = await fixture();
		for (const section of sections.filter(
			(item) => item.type === 'QUIZ' || item.type === 'PRACTICE',
		)) {
			await expect(getLearnStudioSection(section.id)).rejects.toThrow('Không tìm thấy mục học');
			await expect(updateLearnSection(section.id, { title: 'Không đổi' })).rejects.toThrow(
				'Không tìm thấy mục học',
			);
			await expect(listSectionRevisions(section.id)).rejects.toThrow('Không tìm thấy mục học');
		}
		const stats = (await listLearnCoursesForAdmin()).find((item) => item.id === course.id);
		expect(stats).toMatchObject({ sectionCount: 2, questionCount: 1 });
		expect(
			updateLearnSectionSchema.safeParse({
				checkpoint: { question: 'Hỏi', options: ['A', 'B'], correctIndex: 0 },
			}).success,
		).toBe(false);
		expect(updateLearnSectionSchema.safeParse({ checkpoint: null }).success).toBe(true);
	});
	it('keeps lecture examples but does not resurrect retired content when restoring', async () => {
		const { sections } = await fixture();
		const section = sections.find((item) => item.type === 'READING')!;
		const revision = await prisma.learnSectionRevision.create({
			data: {
				sectionId: section.id,
				title: section.title,
				reason: 'manual',
				markdown:
					'## Giảng\nVí dụ thực hành được giữ.\n\n## Câu hỏi tự kiểm tra\nCâu cũ.\n\n## Tiếp\nKiến thức tiếp theo.',
				checkpoint: { question: 'Cũ', options: ['A', 'B'], correctIndex: 0 },
				quiz: { questions: [{ id: 'old' }] },
			},
		});
		const restored = await restoreSectionRevision(section.id, revision.id);
		expect(restored.markdown).toContain('Ví dụ thực hành được giữ.');
		expect(restored.markdown).toContain('Kiến thức tiếp theo.');
		expect(restored.markdown).not.toContain('Câu cũ.');
		expect(restored).not.toHaveProperty('checkpoint');
		const stored = await prisma.learnSection.findUniqueOrThrow({ where: { id: section.id } });
		expect(stored.checkpoint).toBeNull();
		expect(stored.quiz).toBeNull();
		const snapshots = await prisma.learnSectionRevision.findMany({
			where: { sectionId: section.id },
		});
		expect(snapshots.some((item) => item.markdown === 'Giảng hiện tại.')).toBe(true);
	});
});
