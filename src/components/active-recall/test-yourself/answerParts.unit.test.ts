import { describe, expect, it } from 'vitest';

import { splitAnswerExample } from './answerParts';

describe('splitAnswerExample', () => {
	it('splits the example paragraph off and drops its label', () => {
		const html =
			'<ul><li><p>Expectancy</p></li></ul><p>Motivation = E × I × V.</p><p><strong>Example:</strong> Huong wins a trip.</p><p>She fears flying.</p>';
		expect(splitAnswerExample(html)).toEqual({
			main: '<ul><li><p>Expectancy</p></li></ul><p>Motivation = E × I × V.</p>',
			example: '<p>Huong wins a trip.</p><p>She fears flying.</p>',
		});
	});

	it('reads the Vietnamese label, with the colon outside the bold', () => {
		const parts = splitAnswerExample('<p>Ý chính.</p><p><b>Ví dụ</b>: Hương đạt chỉ tiêu.</p>');
		expect(parts).toEqual({ main: '<p>Ý chính.</p>', example: '<p>Hương đạt chỉ tiêu.</p>' });
	});

	it('keeps answers without an example, or that open with one, whole', () => {
		expect(splitAnswerExample('<p>Example of a theory is X.</p>').example).toBe('');
		expect(splitAnswerExample('<p><strong>Example:</strong> only.</p>').example).toBe('');
		expect(splitAnswerExample('<p>Plain answer.</p>')).toEqual({
			main: '<p>Plain answer.</p>',
			example: '',
		});
	});
});
