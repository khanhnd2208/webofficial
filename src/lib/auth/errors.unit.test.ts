import { describe, expect, it } from 'vitest';

import { AUTH_ERROR_MESSAGES, authErrorMessage } from './errors';

describe('authErrorMessage', () => {
	it('maps CallbackRouteError separately from the default copy', () => {
		expect(authErrorMessage('CallbackRouteError')).toBe(AUTH_ERROR_MESSAGES.CallbackRouteError);
		expect(authErrorMessage('CallbackRouteError')).not.toBe(AUTH_ERROR_MESSAGES.Default);
	});

	it('covers account linking, denial, configuration, and session errors', () => {
		expect(authErrorMessage('OAuthAccountNotLinked')).toContain('liên kết');
		expect(authErrorMessage('AccessDenied')).toContain('từ chối');
		expect(authErrorMessage('Configuration')).toContain('Cấu hình');
		expect(authErrorMessage('SessionRequired')).toContain('đăng nhập');
	});

	it('falls back for unknown codes and returns null when absent', () => {
		expect(authErrorMessage('Nope')).toBe(AUTH_ERROR_MESSAGES.Default);
		expect(authErrorMessage(undefined)).toBeNull();
	});
});
