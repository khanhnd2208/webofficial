import Link from 'next/link';

import SignInWithGoogleButton from './sign-in-with-google-button';

const FEATURES = [
	{
		icon: '💬',
		title: 'Bình luận & Reaction',
		desc: 'Tương tác với bài viết, chia sẻ ý kiến',
	},
	{
		icon: '📚',
		title: 'Học từ vựng',
		desc: 'Flashcards, trắc nghiệm, luyện nghe',
	},
	{
		icon: '📊',
		title: 'Theo dõi tiến độ',
		desc: 'Dashboard cá nhân, streak học tập',
	},
	{
		icon: '📝',
		title: 'Gửi phản hồi',
		desc: 'Liên hệ trực tiếp với giảng viên',
	},
];

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
								<span className="text-xl">{f.icon}</span>
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
