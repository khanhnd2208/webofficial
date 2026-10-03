import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCsrfToken } from 'next-auth/react';
import { signOutTo } from './signOutTo';

vi.mock('next-auth/react', () => ({ getCsrfToken: vi.fn() }));
afterEach(() => {
	document.querySelectorAll('form').forEach((form) => form.remove());
	vi.restoreAllMocks();
});

describe('native sign-out', () => {
	it('submits a CSRF-protected document POST with a same-origin destination', async () => {
		vi.mocked(getCsrfToken).mockResolvedValue('test-csrf');
		const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
		await signOutTo('/dang-nhap?from=%2Fkhoa-hoc&chon=1');
		const form = document.querySelector('form')!;
		expect(form.method).toBe('post');
		expect(new URL(form.action).pathname).toBe('/api/auth/signout');
		const fields = new FormData(form);
		expect(fields.get('csrfToken')).toBe('test-csrf');
		expect(fields.get('callbackUrl')).toBe(
			`${window.location.origin}/dang-nhap?from=%2Fkhoa-hoc&chon=1`,
		);
		expect(submit).toHaveBeenCalledOnce();
	});
	it('refuses a missing CSRF token', async () => {
		vi.mocked(getCsrfToken).mockResolvedValue('');
		await expect(signOutTo('/')).rejects.toThrow('Could not prepare sign-out');
		expect(document.querySelector('form')).toBeNull();
	});
	it('replaces an external destination with the homepage', async () => {
		vi.mocked(getCsrfToken).mockResolvedValue('test-csrf');
		vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
		await signOutTo('//evil.example');
		expect(new FormData(document.querySelector('form')!).get('callbackUrl')).toBe(
			`${window.location.origin}/`,
		);
	});
});
