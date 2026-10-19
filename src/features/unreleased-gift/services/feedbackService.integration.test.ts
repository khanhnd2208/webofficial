import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';

import { hasFeedback, listFeedback, recordFeedback } from './feedbackService';

vi.mock('server-only', () => ({}));

describe('UNRELEASED feedback persistence', () => {
	beforeEach(async () => {
		await prisma.unreleasedGiftResponse.deleteMany();
	});

	afterEach(async () => {
		await prisma.unreleasedGiftResponse.deleteMany();
	});

	it('stores anonymous ratings and comments and recognizes a completed response', async () => {
		const created = await recordFeedback({
			overall: 9,
			usefulness: 8,
			clarity: 10,
			comment: 'Ví dụ rất dễ áp dụng.',
		});
		expect(await hasFeedback(created.id)).toBe(true);
		expect(await hasFeedback('00000000-0000-0000-0000-000000000000')).toBe(false);
		expect(await listFeedback()).toEqual([
			expect.objectContaining({
				id: created.id,
				overall: 9,
				usefulness: 8,
				clarity: 10,
				comment: 'Ví dụ rất dễ áp dụng.',
			}),
		]);
	});
});
