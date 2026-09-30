import { describe, expect, it } from 'vitest';
import { inquiryListHref, inquiryQuery, adminDate } from './inquiryNavigation';
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
});
