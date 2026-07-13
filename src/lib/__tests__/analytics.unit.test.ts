import { describe, expect, it } from 'vitest';

import { ANALYTICS_EVENTS, isAnalyticsEvent } from '@/lib/analytics';

describe('analytics event whitelist', () => {
	it('accepts only contracted events', () => {
		expect(isAnalyticsEvent('service_view')).toBe(true);
		expect(isAnalyticsEvent('contact_form_submit')).toBe(true);
		expect(isAnalyticsEvent('email_open')).toBe(false);
		expect(ANALYTICS_EVENTS).toContain('course_interest');
	});
});
