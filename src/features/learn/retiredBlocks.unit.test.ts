import { describe, expect, it } from 'vitest';

import {
	isRetiredPracticeHeading,
	stripRetiredPracticeBlocks,
	unclearPracticeHeadings,
} from './retiredBlocks';

describe('retired practice blocks', () => {
	it('preserves untouched source and blank lines inside fenced examples', () => {
		const source = '\n```text\nA\n\n\nB\n```\n';
		expect(stripRetiredPracticeBlocks(source).markdown).toBe(source);
		const withRetired = source + '\n## Bài tập thực hành\nBỏ.\n## Giảng tiếp\nGiữ.';
		expect(stripRetiredPracticeBlocks(withRetired).markdown).toContain('A\n\n\nB');
	});
	it('removes a practice heading until the next heading of the same level', () => {
		const source = [
			'## Giảng',
			'Giữ ví dụ thực hành trong đoạn này.',
			'',
			'## Câu hỏi tự kiểm tra',
			'1. Câu bị bỏ',
			'',
			'## Tiếp',
			'Còn lại.',
		].join('\n');
		const stripped = stripRetiredPracticeBlocks(source);
		expect(stripped.removed).toEqual(['Câu hỏi tự kiểm tra']);
		expect(stripped.markdown).toContain('Giữ ví dụ thực hành');
		expect(stripped.markdown).toContain('## Tiếp');
		expect(stripped.markdown).not.toContain('Câu bị bỏ');
	});

	it('ignores a retired heading written inside a code fence', () => {
		const source = ['```', '## Bài tập thực hành', 'giữ', '```', '', 'Đoạn sau.'].join('\n');
		const stripped = stripRetiredPracticeBlocks(source);
		expect(stripped.removed).toEqual([]);
		expect(stripped.markdown).toContain('## Bài tập thực hành');
	});

	it('reports an unclear heading without treating it as retired', () => {
		expect(isRetiredPracticeHeading('Bài tập thực hành trong tuần')).toBe(true);
		expect(isRetiredPracticeHeading('Ví dụ thực hành')).toBe(false);
		expect(unclearPracticeHeadings('## Ví dụ thực hành\n\nNội dung.')).toEqual(['Ví dụ thực hành']);
		expect(unclearPracticeHeadings('#### Bước 2 — Kiểm tra lại')).toEqual([]);
	});
});
