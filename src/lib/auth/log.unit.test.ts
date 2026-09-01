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

	it('redacts emails and secrets from free text', () => {
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toMatch(/admin@/);
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toContain('sekrit');
		expect(redactAuthText('Bearer abc.def and admin@site.com token=sekrit')).not.toContain('abc.def');
	});
});
