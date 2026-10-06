import { describe, expect, it } from 'vitest';

import {
	courseHue,
	courseStatus,
	percentOf,
	summarizeCourse,
	toCurriculumLessons,
} from './progress';
import type { LearnCourseOutline } from './types';

const outline: Pick<LearnCourseOutline, 'lessons'> = {
	lessons: [
		{
			id: 'l1',
			title: 'Mở đầu',
			description: '',
			sections: [
				{ id: 's1', title: 'Khái niệm', type: 'READING', minutes: 5 },
				{ id: 's2', title: 'Ví dụ', type: 'READING', minutes: 7 },
			],
		},
		{
			id: 'l2',
			title: 'Vận dụng',
			description: '',
			sections: [
				{ id: 's3', title: 'Tình huống', type: 'READING', minutes: 8 },
				{ id: 's4', title: 'Câu hỏi phản biện', type: 'DISCUSSION', minutes: 10 },
			],
		},
	],
};

describe('summarizeCourse', () => {
	it('starts a fresh learner on the first section', () => {
		const summary = summarizeCourse(outline, {});
		expect(summary.status).toBe('not-started');
		expect(summary.nextSection?.id).toBe('s1');
		// Critical questions are optional: neither their minutes nor the section count towards the course.
		expect(summary.totalCount).toBe(3);
		expect(summary.totalMinutes).toBe(20);
		expect(summary.remainingMinutes).toBe(20);
		expect(summary.sections).toHaveLength(4);
	});

	it('resumes at the first unfinished section, even past a gap', () => {
		const summary = summarizeCourse(outline, {
			s1: { completed: true, note: '' },
			s3: { completed: true, note: 'nhớ' },
		});
		expect(summary.status).toBe('in-progress');
		expect(summary.nextSection?.id).toBe('s2');
		expect(summary.completedCount).toBe(2);
		expect(summary.percent).toBe(67);
		expect(summary.remainingMinutes).toBe(7);
		expect(summary.lessons.map((lesson) => lesson.completedCount)).toEqual([1, 1]);
		expect(summary.sections[2]).toMatchObject({
			lessonIndex: 1,
			sectionIndex: 0,
			lessonTitle: 'Vận dụng',
		});
	});

	it('completes the course once every lecture is done, critical questions or not', () => {
		const done = { completed: true, note: '' };
		const summary = summarizeCourse(outline, { s1: done, s2: done, s3: done });
		expect(summary.status).toBe('completed');
		expect(summary.nextSection).toBeNull();
		expect(summary.percent).toBe(100);
		expect(summary.lessons[1]).toMatchObject({ completedCount: 1, requiredCount: 1 });
	});

	it('keeps note bodies out of the client curriculum', () => {
		const summary = summarizeCourse(outline, {
			s2: { completed: false, note: '  ghi chú  ' },
		});
		const lessons = toCurriculumLessons(summary.lessons);
		expect(lessons[0].sections[1]).toMatchObject({ id: 's2', hasNote: true });
		expect(lessons[0].sections[1]).not.toHaveProperty('note');
		expect(lessons[0].sections[0].hasNote).toBe(false);
	});
});

describe('course helpers', () => {
	it('classifies status and percent', () => {
		expect(courseStatus(0, 0)).toBe('not-started');
		expect(courseStatus(0, 4)).toBe('not-started');
		expect(courseStatus(1, 4)).toBe('in-progress');
		expect(courseStatus(4, 4)).toBe('completed');
		expect(percentOf(1, 3)).toBe(33);
		expect(percentOf(0, 0)).toBe(0);
	});

	it('gives each course a stable hue', () => {
		expect(courseHue('quan-tri-hoc')).toBe(courseHue('quan-tri-hoc'));
		expect(courseHue('quan-tri-hoc')).toBeGreaterThanOrEqual(0);
		expect(courseHue('quan-tri-hoc')).toBeLessThan(360);
	});
});
