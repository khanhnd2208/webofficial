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
							<NavLink href="/admin/feedback" icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}>
								Phản hồi
							</NavLink>
							<NavLink href="/admin/feedback/messages" icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}>
								Tin nhắn
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
						<Link className="hover:text-foreground" href="/feedback" target="_blank">
							Phản hồi ↗
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
