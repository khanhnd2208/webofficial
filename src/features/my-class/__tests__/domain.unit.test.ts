import { describe, expect, it } from 'vitest';

import { activeCourseUserKey, normalizeEmail, normalizeSlug } from '../domain/normalize';
import { analyzeCurriculum } from '../imports/curriculum';
import { assertTestScope } from '../domain/scope';
import { validateCoursePublish, validateKnowledgeUnitPublish, validateTestPublish } from '../domain/publishValidation';
import { comparePerformanceRows } from '../analytics/sort';
import { formatEvidenceSummary } from '../domain/format';
import { courseVocabScopeKey, lessonVocabScopeKey } from '../domain/vocabScope';
import { prepareReaderHtml } from '../domain/readerHtml';

describe('normalization', () => {
	it('normalizes email and slug', () => {
		expect(normalizeEmail('  A@Example.COM ')).toBe('a@example.com');
		expect(normalizeSlug('Định nghĩa HRM')).toBe('dinh-nghia-hrm');
		expect(activeCourseUserKey('c1', 'u1')).toBe('c1:u1');
	});
});

describe('publish validation', () => {
	it('requires KU title and at least one level', () => {
		expect(validateKnowledgeUnitPublish({ title: '', foundationHtml: '', academicHtml: '', expertHtml: '' })).toHaveLength(2);
		expect(validateKnowledgeUnitPublish({ title: 'Reliability', foundationHtml: '<p>x</p>', academicHtml: '', expertHtml: '' })).toHaveLength(0);
	});

	it('warns when tests map KU outside the course', () => {
		const issues = validateTestPublish({
			questionCount: 1,
			inactiveQuestionCount: 0,
			unpublishedKuTitles: [],
			outOfCourseKuTitles: ['Validity'],
		});
		expect(issues.some((issue) => issue.code === 'TEST_KU_OUT_OF_COURSE' && issue.severity === 'warning')).toBe(true);
	});

	it('blocks a published lesson without a valid section', () => {
		const issues = validateCoursePublish({
			title: 'HRM',
			lessons: [{ id: 'l1', title: 'Selection', status: 'PUBLISHED', sections: [] }],
		});
		expect(issues.some((issue) => issue.code === 'LESSON_NO_SECTION')).toBe(true);
		expect(issues[0]?.nodeType).toBe('lesson');
		expect(issues[0]?.nodeId).toBe('l1');
	});
});

describe('scope validation', () => {
	it('rejects lesson/section ids on course-scoped tests', () => {
		expect(() => assertTestScope({ scope: 'COURSE', courseId: 'c1', lessonId: 'l1' })).toThrow(/Course/);
		expect(() =>
			assertTestScope({ scope: 'LESSON', courseId: 'c1', lessonId: 'l1', lessonCourseId: 'c1' }),
		).not.toThrow();
		expect(() =>
			assertTestScope({
				scope: 'SECTION',
				courseId: 'c1',
				lessonId: 'l1',
				sectionId: 's1',
				lessonCourseId: 'c1',
				sectionLessonId: 'other',
			}),
		).toThrow(/Section/);
	});
});

describe('curriculum import analysis', () => {
	it('detects duplicate lesson slugs and reuses KU slugs in the payload', () => {
		const analysis = analyzeCurriculum({
			course: { title: 'HRM', slug: 'hrm' },
			lessons: [
				{
					slug: 'a',
					title: 'A',
					position: 0,
					sections: [
						{
							title: 'S1',
							position: 0,
							knowledgeUnits: [
								{ slug: 'reliability', title: 'Reliability', position: 0 },
								{ slug: 'reliability', title: 'Reliability again', position: 1 },
							],
						},
					],
				},
				{ slug: 'a', title: 'Dup', position: 1, sections: [] },
			],
		});
		expect(analysis.errors.some((error) => /Lesson slug/.test(error))).toBe(true);
		expect(analysis.knowledgeUnits.map((item) => item.action)).toEqual(['create', 'reuse-payload']);
	});
});

describe('analytics DTO', () => {
	it('sorts by accuracy, then evidence, then title, without mastery labels', () => {
		const rows = [
			{ title: 'B', accuracy: 50, evidence: 2 },
			{ title: 'A', accuracy: 50, evidence: 2 },
			{ title: 'C', accuracy: 50, evidence: 4 },
			{ title: 'D', accuracy: 80, evidence: 1 },
		];
		expect([...rows].sort(comparePerformanceRows).map((row) => row.title)).toEqual(['D', 'C', 'A', 'B']);
		expect(JSON.stringify(rows)).not.toMatch(/mastery|yếu|vững/i);
		expect(formatEvidenceSummary(0.5, 1, 50)).toContain('evidence');
	});
});

describe('vocab assignment scope keys', () => {
	it('uses explicit scope keys so course-level null lessons cannot collide', () => {
		expect(courseVocabScopeKey('c1', 's1')).toBe('course:c1:set:s1');
		expect(lessonVocabScopeKey('l1', 's1')).toBe('lesson:l1:set:s1');
		expect(courseVocabScopeKey('c1', 's1')).not.toBe(lessonVocabScopeKey('l1', 's1'));
	});
});

describe('reader html', () => {
	it('promotes the lowest heading to h2 and stamps stable ids', () => {
		const prepared = prepareReaderHtml('<h3>Main point</h3><h4>Example</h4><p>body</p>');
		expect(prepared.html).toContain('id="main-point"');
		expect(prepared.html).toContain('<h2');
		expect(prepared.headings.map((item) => item.text)).toEqual(['Main point', 'Example']);
	});

	it('wraps hierarchical and single-level leading numbers in mc-hnum', () => {
		const hierarchical = prepareReaderHtml('<h2>1.1 HRM trả lời ba câu hỏi</h2>');
		expect(hierarchical.html).toContain('<span class="mc-hnum">1.1</span> HRM trả lời ba câu hỏi');
		expect(hierarchical.headings[0]?.text).toBe('1.1 HRM trả lời ba câu hỏi');

		const single = prepareReaderHtml('<h2>1. Người, việc, tổ chức</h2>');
		expect(single.html).toContain('<span class="mc-hnum">1.</span> Người, việc, tổ chức');
	});

	it('leaves unnumbered headings untouched', () => {
		const prepared = prepareReaderHtml('<h2>Điểm chính</h2><p>body</p>');
		expect(prepared.html).not.toContain('mc-hnum');
		expect(prepared.headings[0]?.text).toBe('Điểm chính');
	});
});
