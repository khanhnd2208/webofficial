import { describe, expect, it } from 'vitest';

import { updateTeachingPublicPageSchema } from '../schemas';

describe('public teaching page validation', () => {
	const valid = {
		publicSlug: 'hrm-fall-2026',
		publicTitle: 'HRM',
		publicSummary: 'A public class summary',
		publicDescription: '',
		publicAnnouncement: '',
		links: [],
	};

	it('allows saving content independently from the share state', () => {
		expect(updateTeachingPublicPageSchema.safeParse({ ...valid, publicSummary: '' }).success).toBe(
			true,
		);
	});

	it('rejects non-web resource URL schemes', () => {
		expect(
			updateTeachingPublicPageSchema.safeParse({
				...valid,
				links: [{ label: 'Unsafe', url: 'javascript:alert(1)', description: '' }],
			}).success,
		).toBe(false);
	});
});
