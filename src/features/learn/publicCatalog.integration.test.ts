import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listPublishedCoursePreviews } from './publicCatalog';

describe('public course previews', () => {
	const ids: string[] = [];
	afterEach(async () => {
		await prisma.learnCourse.deleteMany({ where: { id: { in: ids.splice(0) } } });
	});
	it('shows published syllabuses without exposing drafts or lesson content', async () => {
		const suffix = randomUUID();
		const published = await prisma.learnCourse.create({
			data: {
				slug: `public-preview-${suffix}`,
				title: 'Preview fixture',
				status: 'PUBLISHED',
				lessons: {
					create: [
						{
							title: 'Second lesson',
							position: 2,
							sections: {
								create: {
									title: 'Private reading',
									markdown: 'Private lesson body',
									estimatedMinutes: 7,
								},
							},
						},
						{
							title: 'First lesson',
							position: 1,
							sections: { create: { title: 'Private practice', estimatedMinutes: 5 } },
						},
					],
				},
			},
		});
		ids.push(published.id);
		const draft = await prisma.learnCourse.create({
			data: { slug: `draft-preview-${suffix}`, title: 'Draft', status: 'DRAFT' },
		});
		ids.push(draft.id);
		const previews = await listPublishedCoursePreviews();
		expect(previews.some((course) => course.slug === draft.slug)).toBe(false);
		const course = previews.find((course) => course.slug === published.slug);
		expect(course).toMatchObject({
			lessonCount: 2,
			totalMinutes: 12,
			lessonTitles: ['First lesson', 'Second lesson'],
		});
		expect(JSON.stringify(course)).not.toContain('Private lesson body');
		expect(course).not.toHaveProperty('lessons');
	});
});
