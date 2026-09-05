import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

describe('Next redirects', () => {
	it('redirects legacy Admin Teaching pages toward the canonical workspace only', async () => {
		const redirects = await nextConfig.redirects?.();

		expect(redirects).toBeDefined();
		expect(redirects?.some((entry) => entry.source.startsWith('/my-space/teaching'))).toBe(false);

		const bySource = Object.fromEntries(
			redirects?.map((entry) => [entry.source, entry.destination]) ?? [],
		);
		expect(bySource).toMatchObject({
			'/admin/teaching': '/my-space/teaching',
			'/admin/teaching/:classId': '/my-space/teaching/:classId',
			'/admin/teaching/:classId/attendance-board': '/my-space/teaching/:classId?tab=share',
			'/admin/teaching/:classId/gradebook': '/my-space/teaching/:classId?tab=attendance',
			'/admin/teaching/:classId/roster': '/my-space/teaching/:classId?tab=students',
			'/admin/teaching/:classId/sessions': '/my-space/teaching/:classId?tab=setup',
			'/admin/teaching/:classId/settings': '/my-space/teaching/:classId?tab=setup',
			'/admin/teaching/:classId/public': '/my-space/teaching/:classId?tab=setup',
		});
	});
});
