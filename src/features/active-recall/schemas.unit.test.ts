import { describe, expect, it } from 'vitest';

import { activeRecallCardInputSchema } from './schemas';

describe('activeRecallCardInputSchema', () => {
	it('stores pasted markdown as sanitized HTML', () => {
		const parsed = activeRecallCardInputSchema.parse({
			question: 'What is **HRM**?',
			answer: 'A *system* with <u>rules</u> and <span style="color: #dc2626">risk</span>.',
		});

		expect(parsed.question).toContain('<strong>HRM</strong>');
		expect(parsed.answer).toContain('<em>system</em>');
		expect(parsed.answer).toContain('<u>rules</u>');
		expect(parsed.answer).toContain('<span style="color: #dc2626">risk</span>');
	});

	it('rejects empty formatting-only cards and unsafe markup leftovers', () => {
		expect(() =>
			activeRecallCardInputSchema.parse({ question: '<p></p>', answer: 'Answer' }),
		).toThrow(/Câu hỏi không được để trống/);

		const literal = activeRecallCardInputSchema.parse({
			question: 'See file_name_test and 2 * 3 * 4',
			answer: 'Answer',
		});
		expect(literal.question).toContain('file_name_test');
		expect(literal.question).toContain('2 * 3 * 4');
		expect(literal.question).not.toContain('<em>');

		const parsed = activeRecallCardInputSchema.parse({
			question: '<p>Safe<script>alert(1)</script></p>',
			answer: 'Answer',
		});
		expect(parsed.question).toContain('Safe');
		expect(parsed.question).not.toContain('script');
	});
});
