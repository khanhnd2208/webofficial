import Link from 'next/link';

import SignInWithGoogleButton from './sign-in-with-google-button';

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string }>;
}) {
	const sp = await searchParams;
	const from = sp?.from ?? '/dashboard';

	return (
		<main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16">
			<div className="w-full max-w-sm">
				{/* Logo */}
				<div className="text-center">
					<Link href="/" className="inline-flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
							<span className="text-sm font-black text-background">N</span>
						</div>
					</Link>
					<h1 className="mt-8 text-2xl font-black uppercase tracking-tight text-foreground">
						Đăng nhập
					</h1>
					<p className="mt-2 text-sm text-foreground-secondary">
						Đăng nhập để truy cập khóa học và luyện tập từ vựng.
					</p>
				</div>

				{/* Sign in button */}
				<div className="mt-8">
					<SignInWithGoogleButton callbackUrl={from} />
				</div>

				<p className="mt-8 text-center text-xs text-muted">
					Bằng việc đăng nhập, bạn đồng ý với điều khoản sử dụng.
				</p>
			</div>
		</main>
	);
}
