import { describe, expect, it } from 'vitest';

import { gradeResponse, normalizeBlankText, scalePoints } from '../domain/grading';
import { parseAnswerSpec, coerceLearnerResponse, displayCorrect, displayChosen } from '../domain/answerSpec';
import { joinTopicPath, topicDepthFromPath, isTopicPathMatch, rewriteDescendantPaths } from '../domain/topicPath';
import { placementKey } from '../domain/placementKey';
import { normalizeBankFilter, bankFilterFromSearch } from '../domain/bankFilter';
import { questionBodySchema } from '../schemas';

describe('answer spec', () => {
	it('parses MCQ single, multi, and fill-blank', () => {
		expect(parseAnswerSpec({ type: 'MCQ_SINGLE', correctKey: 'B' })).toEqual({
			type: 'MCQ_SINGLE',
			correctKey: 'B',
		});
		expect(
			parseAnswerSpec({ type: 'MCQ_MULTI', correctKeys: ['A', 'C'], scoring: 'PARTIAL' }),
		).toMatchObject({ type: 'MCQ_MULTI', scoring: 'PARTIAL' });
		expect(
			parseAnswerSpec({
				type: 'FILL_BLANK',
				scoring: 'ALL_OR_NOTHING',
				blanks: [{ id: '1', length: 3, accepted: ['HRM'], caseSensitive: false, ignoreDiacritics: true }],
			}).type,
		).toBe('FILL_BLANK');
	});

	it('coerces a legacy string into MCQ_SINGLE', () => {
		expect(coerceLearnerResponse('b')).toEqual({ type: 'MCQ_SINGLE', key: 'B' });
	});

	it('displays chosen and correct answers', () => {
		expect(displayCorrect({ type: 'MCQ_SINGLE', correctKey: 'A' })).toBe('A');
		expect(displayChosen({ type: 'MCQ_MULTI', keys: ['A', 'C'] })).toBe('A, C');
	});
});

describe('grading', () => {
	it('grades MCQ single', () => {
		const answer = { type: 'MCQ_SINGLE' as const, correctKey: 'A' as const };
		expect(gradeResponse(answer, { type: 'MCQ_SINGLE', key: 'A' })).toEqual({ earned: 1, max: 1, isCorrect: true });
		expect(gradeResponse(answer, { type: 'MCQ_SINGLE', key: 'B' }).isCorrect).toBe(false);
	});

	it('grades MCQ multi all-or-nothing and partial', () => {
		const answer = { type: 'MCQ_MULTI' as const, correctKeys: ['A' as const, 'C' as const], scoring: 'ALL_OR_NOTHING' as const };
		expect(gradeResponse(answer, { type: 'MCQ_MULTI', keys: ['A', 'C'] }).isCorrect).toBe(true);
		expect(gradeResponse(answer, { type: 'MCQ_MULTI', keys: ['A'] }).earned).toBe(0);
		const partial = { ...answer, scoring: 'PARTIAL' as const };
		expect(gradeResponse(partial, { type: 'MCQ_MULTI', keys: ['A'] }).earned).toBe(0.5);
		expect(gradeResponse(partial, { type: 'MCQ_MULTI', keys: ['A', 'B'] }).earned).toBe(0);
	});

	it('grades fill-blank with diacritic folding', () => {
		const answer = {
			type: 'FILL_BLANK' as const,
			scoring: 'ALL_OR_NOTHING' as const,
			blanks: [{ id: '1', length: 3, accepted: ['Đúng'], caseSensitive: false, ignoreDiacritics: true }],
		};
		expect(normalizeBlankText('dung', { caseSensitive: false, ignoreDiacritics: true })).toBe(
			normalizeBlankText('Đúng', { caseSensitive: false, ignoreDiacritics: true }),
		);
		expect(gradeResponse(answer, { type: 'FILL_BLANK', blanks: { '1': 'dung' } }).isCorrect).toBe(true);
		expect(scalePoints({ earned: 0.5, max: 1, isCorrect: false }, 4)).toEqual({ earned: 2, max: 4 });
	});
});

describe('topic path', () => {
	it('joins and matches descendants', () => {
		expect(joinTopicPath('ngu-phap', 'thi')).toBe('ngu-phap/thi');
		expect(topicDepthFromPath('ngu-phap/thi/htht')).toBe(2);
		expect(isTopicPathMatch('ngu-phap/thi', 'ngu-phap', true)).toBe(true);
		expect(isTopicPathMatch('tu-vung', 'ngu-phap', true)).toBe(false);
		expect(rewriteDescendantPaths('a', 'b', [{ id: '1', path: 'a/c' }])[0]?.path).toBe('b/c');
	});
});

describe('placement key', () => {
	it('uses dashes for missing lesson and section', () => {
		expect(placementKey({ testId: 't', courseId: 'c' })).toBe('t:c:-:-');
		expect(placementKey({ testId: 't', courseId: 'c', lessonId: 'l', sectionId: 's' })).toBe('t:c:l:s');
	});
});

describe('bank filter', () => {
	it('does not drop knowledgeUnitIds when courseId is set', () => {
		const filter = normalizeBankFilter({
			courseId: 'course-1',
			knowledgeUnitIds: ['ku-1'],
			types: ['MCQ_SINGLE', 'MCQ_SINGLE'],
			bloom: [2, 9, 2],
		});
		expect(filter.courseId).toBe('course-1');
		expect(filter.knowledgeUnitIds).toEqual(['ku-1']);
		expect(filter.types).toEqual(['MCQ_SINGLE']);
		expect(filter.bloom).toEqual([2]);
	});

	it('parses search params', () => {
		const filter = bankFilterFromSearch(
			new URLSearchParams('q=hrm&type=MCQ_MULTI&bloom=3&courseId=c1&knowledgeUnitId=ku1'),
		);
		expect(filter.q).toBe('hrm');
		expect(filter.types).toEqual(['MCQ_MULTI']);
		expect(filter.courseId).toBe('c1');
		expect(filter.knowledgeUnitIds).toEqual(['ku1']);
	});
});

describe('question body schema', () => {
	const options = [
		{ key: 'A' as const, text: 'One' },
		{ key: 'B' as const, text: 'Two' },
	];

	it('requires answer.correctKey to exist and Bloom 1-6', () => {
		const base = { stem: 'Q?', options, explanation: '', knowledgeUnitIds: ['ku1'] };
		expect(
			questionBodySchema.safeParse({ ...base, answer: { type: 'MCQ_SINGLE', correctKey: 'C' }, difficulty: 3 }).success,
		).toBe(false);
		expect(
			questionBodySchema.safeParse({ ...base, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, difficulty: 0 }).success,
		).toBe(false);
		expect(
			questionBodySchema.safeParse({ ...base, answer: { type: 'MCQ_SINGLE', correctKey: 'A' }, difficulty: 6 }).success,
		).toBe(true);
	});
});
