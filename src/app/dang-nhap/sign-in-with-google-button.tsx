'use client';

import { useEffect, useState } from 'react';

import { startGoogleSignIn } from '@/lib/auth/startGoogleSignIn';

// Google’s HTML button configurator: https://developers.google.com/identity/branding-guidelines
function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 48 48" aria-hidden="true" className={className} focusable="false">
			<path
				fill="#EA4335"
				d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
			/>
			<path
				fill="#4285F4"
				d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
			/>
			<path
				fill="#FBBC05"
				d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
			/>
			<path
				fill="#34A853"
				d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
			/>
			<path fill="none" d="M0 0h48v48H0z" />
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
	const [error, setError] = useState(false);
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
		setError(false);
		try {
			await startGoogleSignIn(destination, { chooseAccount });
		} catch {
			setError(true);
			setLoading(false);
		}
	};

	return (
		<>
			<button
				type="button"
				disabled={loading}
				onClick={handleSignIn}
				className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#747775]! bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f2f2f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:opacity-60 dark:border-[#8e918f]! dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-[#252526]"
			>
				<span className="rounded-full bg-white p-0.5">
					<GoogleIcon className="h-5 w-5" />
				</span>
				<span>{loading ? 'Đang mở Google…' : 'Tiếp tục với Google'}</span>
			</button>
			{error ? (
				<p role="alert" className="mt-3 text-sm text-ink-secondary">
					Không mở được Google. Kiểm tra kết nối rồi thử lại.
				</p>
			) : null}
		</>
	);
}
