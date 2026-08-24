import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { mapAuthoringCourse, mapPublicCourse } from '../services/mappers';

const revision = {
	title: 'Published title',
	summary: 'Published summary',
	foundationHtml: '<p>Published</p>',
	academicHtml: '',
	expertHtml: '',
};

const draftRevision = {
	title: 'Draft title',
	summary: 'Draft summary',
	foundationHtml: '<p>Secret draft</p>',
	academicHtml: '',
	expertHtml: '',
	status: 'DRAFT',
};

const baseCourse = {
	id: 'c1',
	slug: 'hrm',
	title: 'HRM',
	summary: '',
	description: '',
	thumbnailUrl: null,
	level: null as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null,
	tags: [] as string[],
	status: 'PUBLISHED',
	updatedAt: new Date('2026-08-15T00:00:00.000Z'),
	tests: [] as Array<{
		slug: string;
		title: string;
		description: string;
		scope: 'COURSE';
		_count: { questions: number };
	}>,
};

describe('authoring mappers', () => {
	it('prefers the draft revision and keeps empty lessons', () => {
		const lesson = {
			id: 'l1',
			slug: 'bai-1',
			title: 'Bài 1',
			summary: '',
			position: 0,
			status: 'DRAFT',
			updatedAt: new Date('2026-08-15T00:00:00.000Z'),
			sections: [
				{
					id: 's1',
					slug: 'phan-1',
					title: 'Phần 1',
					summary: '',
					position: 0,
					status: 'DRAFT',
					updatedAt: new Date('2026-08-15T00:00:00.000Z'),
					knowledge: [
						{
							position: 0,
							knowledgeUnit: {
								id: 'u1',
								slug: 'unit-1',
								status: 'PUBLISHED',
								updatedAt: new Date('2026-08-15T00:00:00.000Z'),
								currentPublishedRevision: revision,
								revisions: [draftRevision],
							},
						},
					],
					tests: [],
				},
			],
			tests: [],
		};
		const emptyLesson = {
			...lesson,
			id: 'l2',
			slug: 'bai-2',
			title: 'Bài nháp',
			sections: [],
		};
		const authoring = mapAuthoringCourse({ ...baseCourse, lessons: [lesson, emptyLesson] });
		expect(authoring.lessons).toHaveLength(2);
		expect(authoring.lessons[0]?.sections[0]?.knowledgeUnits[0]?.title).toBe('Draft title');
		expect(authoring.lessons[0]?.sections[0]?.knowledgeUnits[0]?.authoring?.hasDraft).toBe(true);
		expect(authoring.lessons[1]?.sections).toHaveLength(0);

		const published = mapPublicCourse({
			...baseCourse,
			lessons: [
				{
					...lesson,
					sections: [
						{
							...lesson.sections[0]!,
							knowledge: [
								{
									position: 0,
									knowledgeUnit: {
										id: 'u1',
										slug: 'unit-1',
										status: 'PUBLISHED',
										currentPublishedRevision: revision,
									},
								},
							],
						},
					],
				},
			],
		});
		expect(published.lessons[0]?.sections[0]?.knowledgeUnits[0]?.title).toBe('Published title');
		expect(JSON.stringify(published)).not.toContain('Secret draft');
		expect(JSON.stringify(published)).not.toContain('"authoring"');
	});

	it('marks a published library test on a draft placement as unpublished', () => {
		const placement = {
			id: 'place-1',
			scope: 'LESSON' as const,
			position: 0,
			status: 'DRAFT',
			updatedAt: new Date('2026-08-16T00:00:00.000Z'),
			test: {
				id: 't1',
				slug: 'progress-test',
				title: 'Progress Test',
				description: '',
				status: 'PUBLISHED',
				_count: { questions: 3 },
			},
		};
		const authoring = mapAuthoringCourse({
			...baseCourse,
			lessons: [
				{
					id: 'l1',
					slug: 'bai-1',
					title: 'Bài 1',
					summary: '',
					position: 0,
					status: 'PUBLISHED',
					updatedAt: new Date('2026-08-15T00:00:00.000Z'),
					sections: [],
					placements: [placement],
				},
			],
		});
		expect(authoring.lessons[0]?.tests[0]?.authoring).toMatchObject({
			status: 'DRAFT',
			hasDraft: true,
		});
	});

	it('keeps published sections and lessons that only have tests', () => {
		const published = mapPublicCourse({
			...baseCourse,
			lessons: [
				{
					id: 'l1',
					slug: 'bai-1',
					title: 'Bài 1',
					summary: '',
					position: 0,
					sections: [
						{
							id: 's1',
							title: 'Phần 1',
							summary: '',
							position: 0,
							knowledge: [],
							placements: [
								{
									id: 'p-section',
									scope: 'SECTION',
									position: 0,
									test: {
										slug: 'section-quiz',
										title: 'Quiz chủ đề',
										description: '',
										_count: { questions: 2 },
									},
								},
							],
						},
					],
					placements: [
						{
							id: 'p-lesson',
							scope: 'LESSON',
							position: 0,
							test: {
								slug: 'lesson-quiz',
								title: 'Quiz bài',
								description: '',
								_count: { questions: 3 },
							},
						},
					],
				},
			],
			placements: [
				{
					id: 'p-course',
					scope: 'COURSE',
					position: 0,
					test: {
						slug: 'final',
						title: 'Quiz toàn khóa',
						description: '',
						_count: { questions: 5 },
					},
				},
			],
		});
		expect(published.lessons[0]?.sections[0]?.knowledgeUnits).toEqual([]);
		expect(published.lessons[0]?.sections[0]?.tests[0]?.title).toBe('Quiz chủ đề');
		expect(published.lessons[0]?.tests[0]?.title).toBe('Quiz bài');
		expect(published.tests[0]?.title).toBe('Quiz toàn khóa');
	});
});

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const next = join(dir, entry.name);
		return entry.isDirectory() ? walk(next) : [next];
	});
}

describe('public my-class API isolation', () => {
	it('does not load authoring or honor preview/edit flags', () => {
		const root = join(process.cwd(), 'src/app/api/my-class');
		const files = walk(root).filter((file) => file.endsWith('.ts'));
		expect(files.length).toBeGreaterThan(0);
		const banned =
			/findAuthoringCourse|mapAuthoringCourse|loadCourseAuthoringState|getAuthoringCourse|searchParams\.get\(\s*['"](?:edit|preview)['"]\s*\)/;
		for (const file of files) {
			expect({ file, leak: banned.test(readFileSync(file, 'utf8')) }).toEqual({
				file,
				leak: false,
			});
		}
	});
});
