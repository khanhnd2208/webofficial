import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signIn } from 'next-auth/react';
import { startGoogleSignIn } from './startGoogleSignIn';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe('startGoogleSignIn', () => {
	it('returns to the live path without forcing account selection', async () => {
		await startGoogleSignIn('/lien-he?ref=class#form');
		expect(signIn).toHaveBeenCalledWith(
			'google',
			{ redirectTo: '/lien-he?ref=class#form' },
			undefined,
		);
	});
	it('asks for account selection only for an explicit switch', async () => {
		await startGoogleSignIn('/tai-khoan', { chooseAccount: true });
		expect(signIn).toHaveBeenCalledWith(
			'google',
			{ redirectTo: '/tai-khoan' },
			{ prompt: 'select_account' },
		);
	});
	it('rejects login loops and protocol-relative destinations', async () => {
		for (const destination of ['/dang-nhap?from=/dang-nhap', '//example.com']) {
			await startGoogleSignIn(destination);
			expect(signIn).toHaveBeenLastCalledWith('google', { redirectTo: '/' }, undefined);
		}
	});
});
