import { describe, expect, it } from 'vitest';

import { describeAuthError, redactAuthText } from './log';

describe('describeAuthError', () => {
	it('keeps Auth.js codes and cleaned cause names without messages', () => {
		const error = Object.assign(new Error('Callback failed for user@example.com'), {
			name: 'CallbackRouteError',
			cause: Object.assign(new Error('duplicate email user@example.com'), { name: 'AdapterError' }),
		});
		expect(describeAuthError(error)).toEqual({
			code: 'CallbackRouteError',
			cause: 'AdapterError',
		});
	});

	it('reads Auth.js cause.err instead of the wrapper bag', () => {
		const error = Object.assign(new Error('OAuthCallback'), {
			name: 'CallbackRouteError',
			cause: {
				err: Object.assign(new Error('email user@example.com already exists token=sekrit'), {
					name: 'AdapterError',
				}),
				message: 'email user@example.com already exists',
			},
		});
		expect(describeAuthError(error)).toEqual({
			code: 'CallbackRouteError',
			cause: 'AdapterError',
		});
		expect(JSON.stringify(describeAuthError(error))).not.toMatch(/user@|sekrit|already exists/);
	});

	it('prefers Auth.js type over minified production class names', () => {
		const error = {
			name: 'E',
			type: 'OAuthCallbackError',
			cause: {
				err: { name: 'nG', type: 'AdapterError' },
			},
		};
		expect(describeAuthError(error)).toEqual({
			code: 'OAuthCallbackError',
			cause: 'AdapterError',
		});
	});

	it('falls back to AuthError when names are not identifiers', () => {
		const error = { name: 'not a code <script>', cause: { err: { name: 'Bearer abc.secret' } } };
		expect(describeAuthError(error)).toEqual({ code: 'AuthError' });
	});

	it('redacts emails and secrets from free text', () => {
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toMatch(/admin@/);
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toContain(
			'sekrit',
		);
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toContain(
			'abc.def',
		);
	});
});
