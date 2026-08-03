import { describe, expect, it } from 'vitest';

import { isPublishableProof, type PublicTestimonial } from './publicProof';

const base: PublicTestimonial = {
	id: 'proof-1',
	quote: 'Nội dung đã được xác nhận.',
	approval: 'approved',
	verification: 'verified',
};

describe('public proof gate', () => {
	it('publishes proof only when it is both approved and verified', () => {
		expect(isPublishableProof(base)).toBe(true);
		expect(isPublishableProof({ ...base, approval: 'pending' })).toBe(false);
		expect(isPublishableProof({ ...base, verification: 'unverified' })).toBe(false);
	});
});
