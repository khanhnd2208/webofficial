'use client';

import { useEffect, useState } from 'react';

import { startGoogleSignIn } from '@/lib/auth/startGoogleSignIn';

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 48 48" aria-hidden="true" className={className} focusable="false">
			<path
				fill="#FFC107"
				d="M43.611 20.083H42V20H24v8h11.303C33.682 32.657 29.188 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
			/>
			<path
				fill="#FF3D00"
				d="M6.306 14.691 12.88 19.51C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
			/>
			<path
				fill="#4CAF50"
				d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.166 0-9.65-3.319-11.168-7.946l-6.53 5.03C9.612 39.556 16.227 44 24 44z"
			/>
			<path
				fill="#1976D2"
				d="M43.611 20.083H42V20H24v8h11.303a11.98 11.98 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
			/>
		</svg>
	);
}

export default function SignInWithGoogleButton({
	redirectTo,
	callbackUrl,
	chooseAccount = false,
}: {
	redirectTo?: string;
	chooseAccount?: boolean;
	/** @deprecated Auth.js v5 uses redirectTo; kept for existing call sites. */
	callbackUrl?: string;
}) {
	const [loading, setLoading] = useState(false);
	const destination = redirectTo ?? callbackUrl ?? '/tai-khoan';

	// Coming Back from Google restores this page from memory with the button still waiting.
	useEffect(() => {
		const reset = (event: PageTransitionEvent) => {
			if (event.persisted) setLoading(false);
		};
		window.addEventListener('pageshow', reset);
		return () => window.removeEventListener('pageshow', reset);
	}, []);

	const handleSignIn = async () => {
		setLoading(true);
		try {
			await startGoogleSignIn(destination, { chooseAccount });
		} catch {
			setLoading(false);
		}
	};

	return (
		<button
			type="button"
			disabled={loading}
			onClick={handleSignIn}
			className="inline-flex w-full min-h-11 items-center justify-center gap-2.5 rounded-[10px] border-2 border-ink bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wider text-paper transition duration-200 hover:bg-transparent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
		>
			<GoogleIcon className="h-5 w-5" />
			<span>{loading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}</span>
		</button>
	);
}
