import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto max-w-6xl px-6 py-10">
			<header className="mb-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">Admin Portal</h1>
						<p className="mt-1 text-sm text-foreground/70">Quản trị nội dung Blog và hệ thống học tập.</p>
					</div>
					<nav className="flex flex-wrap items-center gap-3 text-sm">
						<Link className="underline underline-offset-4" href="/">
							Trang chủ
						</Link>
						<Link className="underline underline-offset-4" href="/dashboard">
							Dashboard
						</Link>
					</nav>
				</div>

				<div className="mt-5 rounded-xl border border-foreground/10 p-3">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<Link className="rounded-md border border-foreground/15 px-3 py-1.5" href="/admin">
							Admin Home
						</Link>
						<span className="mx-1 text-foreground/30">|</span>
						<Link className="rounded-md border border-foreground/15 px-3 py-1.5" href="/admin/learning">
							Learning
						</Link>
						<Link className="rounded-md border border-foreground/15 px-3 py-1.5" href="/admin/posts">
							Blog
						</Link>
					</div>
				</div>
			</header>

			{children}
		</div>
	);
}
