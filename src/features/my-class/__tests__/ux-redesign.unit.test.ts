import { describe, expect, it } from 'vitest';

import { estimateReadingMinutes, formatDuration } from '../domain/estimateReading';
import { computeStreak } from '../domain/streak';
import {
	courseUnitPath,
	courseWorkspacePath,
	isReservedLessonSlug,
	withEditFlag,
} from '../domain/workspaceUrl';

describe('estimateReadingMinutes', () => {
	it('estimates from HTML word count', () => {
		const html = `<p>${Array.from({ length: 200 }, () => 'từ').join(' ')}</p>`;
		expect(estimateReadingMinutes(html)).toBe(1);
		const longer = `<p>${Array.from({ length: 450 }, () => 'từ').join(' ')}</p>`;
		expect(estimateReadingMinutes(longer)).toBe(3);
	});

	it('formats duration', () => {
		expect(formatDuration(12)).toBe('~12 phút');
		expect(formatDuration(75)).toBe('~1 giờ 15 phút');
	});
});

describe('computeStreak', () => {
	it('counts consecutive UTC days ending today', () => {
		const today = new Date('2026-08-15T12:00:00Z');
		expect(computeStreak(['2026-08-13', '2026-08-14', '2026-08-15'], today)).toBe(3);
		expect(computeStreak(['2026-08-13', '2026-08-15'], today)).toBe(1);
		expect(computeStreak(['2026-08-10'], today)).toBe(0);
	});
});

describe('workspaceUrl', () => {
	it('builds clean path URLs without cuid section ids', () => {
		expect(courseUnitPath('hrm', 'bai-1', 'khai-niem')).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem',
		);
		expect(courseWorkspacePath('hrm', { lesson: 'bai-1', unit: 'khai-niem' })).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem',
		);
		expect(courseWorkspacePath('hrm', { lesson: 'bai-1', unit: 'khai-niem', s: 'tong-quan' })).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem?s=tong-quan',
		);
		expect(courseWorkspacePath('hrm', { lesson: 'bai-1', unit: 'khai-niem', edit: true })).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem?edit=1',
		);
		expect(isReservedLessonSlug('tests')).toBe(true);
		expect(isReservedLessonSlug('hrm-la-gi')).toBe(false);
	});

	it('keeps the edit=1 flag on workspace hrefs', () => {
		expect(withEditFlag('/my-space/my-class/hrm/bai-1/khai-niem', true)).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem?edit=1',
		);
		expect(withEditFlag('/my-space/my-class/hrm/bai-1/khai-niem?s=tong-quan', true)).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem?s=tong-quan&edit=1',
		);
		expect(withEditFlag('/my-space/my-class/hrm/bai-1/khai-niem?edit=1', false)).toBe(
			'/my-space/my-class/hrm/bai-1/khai-niem?edit=1',
		);
	});
});
