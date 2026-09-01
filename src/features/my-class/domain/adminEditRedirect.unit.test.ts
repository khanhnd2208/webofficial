import { describe, expect, it } from 'vitest';

import { adminContentEditorHref } from './adminEditRedirect';

const course = {
	id: 'course-1',
	lessons: [
		{
			id: 'lesson-1',
			slug: 'bai-1',
			sections: [
				{
					id: 'section-1',
					slug: 'tong-quan',
					knowledgeUnits: [{ id: 'unit-9', slug: 'khai-niem' }],
				},
			],
		},
	],
} as unknown as Parameters<typeof adminContentEditorHref>[0];

describe('adminContentEditorHref', () => {
	it('maps a unit slug to the admin content node', () => {
		expect(adminContentEditorHref(course, { lessonSlug: 'bai-1', unitSlug: 'khai-niem' })).toBe(
			'/admin/my-class/courses/course-1/content?node=unit:unit-9',
		);
	});

	it('maps a lesson slug when no unit is given', () => {
		expect(adminContentEditorHref(course, { lessonSlug: 'bai-1' })).toBe(
			'/admin/my-class/courses/course-1/content?node=lesson:lesson-1',
		);
	});

	it('falls back to the course content editor', () => {
		expect(adminContentEditorHref(course)).toBe('/admin/my-class/courses/course-1/content');
	});
});
