import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy } from './contentSecurityPolicy';

describe('buildContentSecurityPolicy', () => {
	it('allows React development diagnostics without weakening production', () => {
		expect(buildContentSecurityPolicy('development')).toContain(
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.toiladuykhanh.com",
		);
		expect(buildContentSecurityPolicy('production')).not.toContain("'unsafe-eval'");
	});

	it('allows the stylesheet and font hosts used by Google Fonts', () => {
		const policy = buildContentSecurityPolicy('production');
		expect(policy).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
		expect(policy).toContain("font-src 'self' data: https://fonts.gstatic.com");
	});
});
