import Link from 'next/link';

import SignInWithGoogleButton from './sign-in-with-google-button';

const FEATURES = [
	{
		icon: (
			<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
				<path d="M10 2.5C5.5 2.5 2 5.5 2 9c0 1.7.72 3.25 1.9 4.4-.1.6-.45 1.9-1.4 2.6 1.2.1 2.8-.4 3.8-1.1.55.15 1.1.25 1.7.1m1.5.4c4 .4 7.3-2.1 7.5-5.8.2-3.7-3.2-6.7-7.5-6.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
			</svg>
		),
		title: 'Bình luận & Reaction',
		desc: 'Tương tác với bài viết',
	},
	{
		icon: (
			<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
				<path d="M10 2L2 6l8 4 8-4-8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
				<path d="M2 10l8 4 8-4M2 14l8 4 8-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		),
		title: 'Học từ vựng',
		desc: 'Flashcards, trắc nghiệm',
	},
	{
		icon: (
			<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
				<path d="M3 14l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
				<rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
			</svg>
		),
		title: 'Theo dõi tiến độ',
		desc: 'Dashboard & streak',
	},
	{
		icon: (
			<svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
				<path d="M2 4.5C2 3.67 2.67 3 3.5 3h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C2.67 15 2 14.33 2 13.5v-9z" stroke="currentColor" strokeWidth="1.4" />
				<path d="M2 4.5l8 5.25L18 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
			</svg>
		),
		title: 'Gửi phản hồi',
		desc: 'Liên hệ giảng viên',
	},
];

/** Map Auth.js error codes → user-friendly Vietnamese messages */
const ERROR_MESSAGES: Record<string, string> = {
	OAuthAccountNotLinked:
		'Email này đã được liên kết với một tài khoản khác. Vui lòng đăng nhập đúng tài khoản Google ban đầu hoặc thử lại.',
	OAuthCallbackError: 'Đã xảy ra lỗi khi xác thực với Google. Vui lòng thử lại.',
	OAuthSignin: 'Không thể kết nối đến Google. Vui lòng thử lại sau.',
	SessionRequired: 'Vui lòng đăng nhập để tiếp tục.',
	Default: 'Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.',
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string; error?: string; callbackUrl?: string }>;
}) {
	const sp = await searchParams;
	const from = sp?.callbackUrl ?? sp?.from ?? '/dashboard';
	const errorCode = sp?.error;
	const errorMessage = errorCode
		? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default
		: null;

	return (
		<main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-16">
			<div className="w-full max-w-sm">
				{/* Error banner */}
				{errorMessage && (
					<div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
						<p className="font-semibold">⚠️ Lỗi đăng nhập</p>
						<p className="mt-1">{errorMessage}</p>
					</div>
				)}

				{/* Logo */}
				<div className="text-center">
					<Link href="/" className="inline-flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
							<span className="text-sm font-black text-background">H</span>
						</div>
					</Link>
					<h1 className="mt-8 text-2xl font-black uppercase tracking-tight text-foreground">
						Đăng nhập
					</h1>
					<p className="mt-2 text-sm text-foreground-secondary">
						Mở khóa toàn bộ tính năng chỉ với tài khoản Google.
					</p>
				</div>

				{/* Sign in button */}
				<div className="mt-8">
					<SignInWithGoogleButton callbackUrl={from} />
				</div>

				{/* Feature list */}
				<div className="mt-10 space-y-4">
					<p className="text-center text-xs font-bold uppercase tracking-widest text-muted">
						Đăng nhập để mở khóa
					</p>
					<div className="grid grid-cols-2 gap-3">
						{FEATURES.map((f) => (
							<div
								key={f.title}
								className="rounded-xl border border-border bg-surface/50 p-3 text-center transition-colors hover:border-border-hover"
							>
								<span className="flex items-center justify-center text-foreground">{f.icon}</span>
								<p className="mt-1.5 text-xs font-bold text-foreground">{f.title}</p>
								<p className="mt-0.5 text-[11px] leading-tight text-muted">{f.desc}</p>
							</div>
						))}
					</div>
				</div>

				<p className="mt-8 text-center text-xs text-muted">
					Bằng việc đăng nhập, bạn đồng ý với điều khoản sử dụng.
				</p>
			</div>
		</main>
	);
}
