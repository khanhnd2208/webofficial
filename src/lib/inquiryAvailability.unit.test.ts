import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getInquiryAvailability } from '@/lib/inquiryAvailability';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('getInquiryAvailability', () => {
	it('requires delivery configuration and a rate-limit secret in production', () => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('RESEND_API_KEY', '');
		vi.stubEnv('INQUIRY_FROM_EMAIL', '');
		vi.stubEnv('INQUIRY_NOTIFY_EMAIL', '');
		vi.stubEnv('AUTH_SECRET', '');
		vi.stubEnv('NEXTAUTH_SECRET', '');

		const availability = getInquiryAvailability();

		expect(availability.enabled).toBe(false);
		expect(availability.emailConfigured).toBe(false);
		expect(availability.rateLimitConfigured).toBe(false);
	});

	it('is enabled in production when all server configuration is present', () => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('RESEND_API_KEY', 're_test');
		vi.stubEnv('INQUIRY_FROM_EMAIL', 'noreply@example.com');
		vi.stubEnv('INQUIRY_NOTIFY_EMAIL', 'admin@example.com');
		vi.stubEnv('AUTH_SECRET', 'rate-limit-secret');

		const availability = getInquiryAvailability();

		expect(availability.enabled).toBe(true);
		expect(availability.disabledReason).toBeUndefined();
	});
});
