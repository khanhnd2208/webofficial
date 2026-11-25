import { describe, expect, it } from 'vitest';

import { normalizeTypedBullets } from './bullets';

describe('normalizeTypedBullets', () => {
	it('turns typed bullets separated by blank lines into one tight list', () => {
		const source = 'Rắc rối kéo đến.\n\n• Một.\n\n• Hai.\n\nĐoạn sau.';
		expect(normalizeTypedBullets(source)).toBe('Rắc rối kéo đến.\n\n- Một.\n- Hai.\n\nĐoạn sau.');
	});

	it('adds the blank line a list needs after a paragraph line', () => {
		expect(normalizeTypedBullets('Ví dụ:\n• Một\n• Hai')).toBe('Ví dụ:\n\n- Một\n- Hai');
	});

	it('leaves fenced code and text without typed bullets unchanged', () => {
		const code = '```\n• giữ nguyên\n```';
		expect(normalizeTypedBullets(code)).toBe(code);
		expect(normalizeTypedBullets('- đã là danh sách\n- hai')).toBe('- đã là danh sách\n- hai');
		expect(normalizeTypedBullets('Giá 5 • 6 trong câu')).toBe('Giá 5 • 6 trong câu');
	});
});
