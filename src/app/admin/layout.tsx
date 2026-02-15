import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			{/* Admin top bar */}
			<header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
					<div className="flex items-center gap-4">
						<Link href="/admin" className="text-sm font-bold tracking-tight text-foreground">
							Admin
						</Link>
						<span className="h-4 w-px bg-border" />
						<nav className="flex items-center gap-1">
							<NavLink href="/admin/posts" icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M16.862 3.487a2.1 2.1 0 013.02 0l.631.631a2.1 2.1 0 010 3.02L9.07 18.58l-4.59 1.15 1.15-4.59L16.862 3.487z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14.5 5.85l3.65 3.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}>
								Blog
							</NavLink>
							<NavLink href="/vocabulary" icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h5l2 2h5a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" /><path d="M9 13h6M9 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}>
								Từ vựng
							</NavLink>
							</nav>
					</div>
					<nav className="flex items-center gap-3 text-xs text-muted">
						<Link className="hover:text-foreground" href="/" target="_blank">
							Trang chủ ↗
						</Link>
						<Link className="hover:text-foreground" href="/blog" target="_blank">
							Blog ↗
						</Link>
						<Link className="hover:text-foreground" href="/dashboard">
							Dashboard
						</Link>
					</nav>
				</div>
			</header>

			{children}
		</div>
	);
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
		>
			{icon}
			{children}
		</Link>
	);
}
