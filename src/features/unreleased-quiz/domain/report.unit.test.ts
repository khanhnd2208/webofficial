import { describe, expect, it } from 'vitest';

import { responsesToCsv, summarizeResponses, type ResponseRow } from './report';
import { scoreSubmission, submissionSchema } from './submission';

const row = (overrides: Partial<ResponseRow>): ResponseRow => ({
	id: 'r',
	respondentId: 'person-a',
	createdAt: new Date('2026-10-16T03:00:00Z'),
	group: 'ban-nhap',
	variant: null,
	note: null,
	q1: 'A',
	q2: 'A',
	q3: 'A',
	q4: 'A',
	q5: 'A',
	q6: 'C',
	q7: 'C',
	registerClickedAt: null,
	...overrides,
});

describe('scoreSubmission', () => {
	it('recomputes the group on the server', () => {
		const result = scoreSubmission({
			q1: 'A',
			q2: 'A',
			q3: 'A',
			q4: 'A',
			q5: 'C',
			q6: 'A',
			q7: 'A',
		});
		expect(result?.group).toBe('dung-bai');
	});

	it('rejects answers to questions the branch skips', () => {
		expect(scoreSubmission({ q1: 'D', q2: 'A', q3: 'A', q4: 'A' })).toBeNull();
		expect(scoreSubmission({ q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'A' })).toBeNull();
	});

	it('rejects an unfinished sheet and letters a question does not offer', () => {
		expect(scoreSubmission({ q1: 'A', q2: 'A', q3: 'A', q4: 'A' })).toBeNull();
		expect(scoreSubmission({ q1: 'E', q3: 'A', q4: 'A' })).toBeNull();
	});

	it('accepts no personal fields', () => {
		const parsed = submissionSchema.safeParse({
			respondentId: 'abcdef12-3456',
			answers: { q1: 'D', q3: 'A', q4: 'A', email: 'x@y.z' },
		});
		expect(parsed.success).toBe(false);
	});
});

describe('summarizeResponses', () => {
	it('counts groups and answers by each person’s latest run', () => {
		const report = summarizeResponses([
			row({ id: '1', createdAt: new Date('2026-10-16T01:00:00Z'), group: 'ban-nhap' }),
			row({
				id: '2',
				createdAt: new Date('2026-10-16T02:00:00Z'),
				group: 'doi-giong',
				q5: 'B',
				registerClickedAt: new Date(),
			}),
			row({
				id: '3',
				respondentId: 'person-b',
				group: 'chua-chon-bai',
				variant: 'no-direction',
				q1: 'D',
				q2: null,
				q5: null,
				q6: null,
				q7: null,
			}),
		]);
		expect(report).toMatchObject({ responses: 3, people: 2, retakes: 1, registerClickPeople: 1 });
		expect(report.groups).toEqual({
			'chua-chon-bai': 1,
			'ban-nhap': 0,
			'doi-giong': 1,
			'dung-bai': 0,
		});
		expect(report.variants).toEqual({ 'no-direction': 1 });
		expect(report.answers.q5).toEqual({ B: 1 });
		expect(report.answers.q1).toEqual({ A: 1, D: 1 });
	});

	it('buckets days in Vietnam time', () => {
		const report = summarizeResponses([
			row({ id: '1', createdAt: new Date('2026-10-15T18:30:00Z') }), // 01:30 on 16/10 in Hanoi
			row({ id: '2', respondentId: 'b', createdAt: new Date('2026-10-15T16:00:00Z') }), // 23:00 on 15/10
		]);
		expect(report.daily).toEqual([
			{ day: '2026-10-15', responses: 1 },
			{ day: '2026-10-16', responses: 1 },
		]);
	});
});

describe('responsesToCsv', () => {
	it('writes one header and one line per run, blanks for skipped questions', () => {
		const csv = responsesToCsv([row({ q2: null })]);
		const [header, line] = csv.trim().split('\n');
		expect(header.split(',')).toHaveLength(13);
		expect(line).toContain(',A,,A,A,');
	});
});
