import { describe, expect, it } from 'vitest';

import { feedbackSummary, feedbackToCsv } from './report';
import { feedbackSubmissionSchema } from './submission';

describe('UNRELEASED feedback', () => {
	it('accepts the boundaries of the 1–10 scale and a long comment', () => {
		expect(
			feedbackSubmissionSchema.safeParse({
				overall: 1,
				usefulness: 10,
				clarity: 7,
				comment: 'Một nhận xét dài. '.repeat(100),
			}).success,
		).toBe(true);
		for (const value of [0, 11, 1.5]) {
			expect(
				feedbackSubmissionSchema.safeParse({
					overall: value,
					usefulness: 5,
					clarity: 5,
					comment: '',
				}).success,
			).toBe(false);
		}
	});

	it('summarizes ratings and exports comments safely for spreadsheets', () => {
		const rows = [
			{
				id: 'a',
				createdAt: new Date('2026-10-19T10:00:00.000Z'),
				overall: 8,
				usefulness: 10,
				clarity: 6,
				comment: '=HYPERLINK("https://example.test")',
			},
			{
				id: 'b',
				createdAt: new Date('2026-10-19T11:00:00.000Z'),
				overall: 10,
				usefulness: 8,
				clarity: 10,
				comment: null,
			},
		];
		expect(feedbackSummary(rows)).toEqual({
			count: 2,
			comments: 1,
			averages: { overall: 9, usefulness: 9, clarity: 8 },
		});
		expect(feedbackToCsv(rows)).toContain('"\'=HYPERLINK(""https://example.test"")"');
	});
});
