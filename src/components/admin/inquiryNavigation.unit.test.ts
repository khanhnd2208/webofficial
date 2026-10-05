import { describe, expect, it } from 'vitest';
import { inquiryListHref, inquiryQuery, adminDate, relativeTime } from './inquiryNavigation';
describe('inquiry navigation', () => {
	it('retains valid filters and encodes search without accepting external destinations', () => {
		expect(inquiryListHref({ page: '3', status: 'NEW', inquiryType: 'ai', search: ' A&B ' })).toBe(
			'/admin/inquiries?page=3&status=NEW&inquiryType=ai&search=A%26B',
		);
	});
	it('resets paging without dropping filters', () => {
		expect(inquiryQuery({ page: '3', status: 'NEW' }, 1)).toBe('?status=NEW');
	});
	it.each(['NaN', '-1', 'Infinity', '1.5', '9007199254740992'])(
		'rejects invalid page %s',
		(page) => {
			expect(inquiryListHref({ page, status: 'invalid', inquiryType: 'invalid' })).toBe(
				'/admin/inquiries',
			);
		},
	);
	it('formats dates in Vietnam regardless of host timezone', () => {
		expect(adminDate('2026-09-30T00:00:00Z')).toContain('07:00');
	});
	it('keeps a failed-notification filter beside the other supported filters', () => {
		expect(inquiryQuery({ notice: 'failed', status: 'NEW', search: 'Lan' }, 1)).toBe(
			'?status=NEW&search=Lan&notice=failed',
		);
		expect(inquiryQuery({ notice: 'sent' })).toBe('');
	});
	it('describes recent instants in Vietnamese and keeps an absolute title source', () => {
		const now = new Date('2026-09-30T10:00:00Z');
		expect(relativeTime('2026-09-30T08:00:00Z', now)).toBe('2 giờ trước');
		expect(relativeTime('2026-09-29T10:00:00Z', now)).toBe('hôm qua');
		expect(relativeTime('2026-09-20T10:00:00Z', now)).toBe(adminDate('2026-09-20T10:00:00Z'));
	});
});
