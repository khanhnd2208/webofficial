'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';

import { ADMIN_NAV_GROUPS } from '@/config/navigation';
import { routes } from '@/config/routes';

const ICONS: Record<string, ReactNode> = {
	[routes.admin.home]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
			<rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
			<rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
			<rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
		</svg>
	),
	[routes.admin.posts]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M4 4.5A1.5 1.5 0 015.5 3h9A1.5 1.5 0 0116 4.5v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5V4.5z" stroke="currentColor" strokeWidth="1.4" />
			<path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
		</svg>
	),
	[routes.admin.postCreate]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
		</svg>
	),
	[routes.admin.courses]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M3 6.5L10 3l7 3.5v7L10 17l-7-3.5v-7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
			<path d="M10 9v8" stroke="currentColor" strokeWidth="1.4" />
		</svg>
	),
	[routes.admin.enrollments]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
			<path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
		</svg>
	),
	[routes.admin.vocabulary]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5V4.5z" stroke="currentColor" strokeWidth="1.4" />
			<path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
		</svg>
	),
	[routes.admin.luckyCard]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M10 2l2.09 4.26L17 7.27l-3.5 3.42L14.18 16 10 13.77 5.82 16l.68-5.31L3 7.27l4.91-.71L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
		</svg>
	),
	[routes.admin.messages]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<path d="M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v7A1.5 1.5 0 0115.5 14H8l-3.5 2.5V5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
		</svg>
	),
	[routes.admin.users]: (
		<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
			<circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
			<path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
		</svg>
	),
};

function useIsActive(pathname: string) {
	return (href: string, exact?: boolean) => {
		if (exact || href === routes.admin.home) return pathname === href;
		if (href === routes.admin.posts) {
			return (
				pathname === routes.admin.posts ||
				(pathname.startsWith(`${routes.admin.posts}/`) && !pathname.startsWith(routes.admin.postCreate))
			);
		}
		return pathname === href || pathname.startsWith(`${href}/`);
	};
}

function NavItem({
	href,
	label,
	icon,
	collapsed,
	active,
	onNavigate,
}: {
	href: string;
	label: string;
	icon: ReactNode;
	collapsed: boolean;
	active: boolean;
	onNavigate?: () => void;
}) {
	return (
		<Link
			href={href}
			title={collapsed ? label : undefined}
			onClick={onNavigate}
			className={`relative flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
				active
					? 'bg-foreground font-semibold text-background'
					: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
			} ${collapsed ? 'justify-center' : ''}`}
		>
			<span className="relative shrink-0">{icon}</span>
			{!collapsed && <span className="truncate">{label}</span>}
		</Link>
	);
}

function NavBody({
	collapsed,
	onNavigate,
}: {
	collapsed: boolean;
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	const isActive = useIsActive(pathname);
	const { data: session } = useSession();

	return (
		<>
			<nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Quản trị">
				<div>
					<NavItem
						href={routes.admin.home}
						label="Tổng quan"
						collapsed={collapsed}
						active={pathname === routes.admin.home}
						icon={ICONS[routes.admin.home]}
						onNavigate={onNavigate}
					/>
				</div>

				{ADMIN_NAV_GROUPS.map(({ group, items }) =>
					items.length === 0 ? null : (
						<div key={group}>
							{!collapsed && (
								<p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">{group}</p>
							)}
							<div className="space-y-0.5">
								{items.map((item) => (
									<NavItem
										key={item.href}
										href={item.href}
										label={item.label}
										collapsed={collapsed}
										active={isActive(item.href, item.exact)}
										icon={ICONS[item.href] ?? ICONS[routes.admin.posts]}
										onNavigate={onNavigate}
									/>
								))}
							</div>
						</div>
					),
				)}
			</nav>

			<div className="space-y-1 border-t border-border p-2">
				{!collapsed && (
					<div className="flex flex-wrap items-center gap-2 px-2 pb-2">
						<a
							href={routes.home}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[11px] text-muted transition-colors hover:text-foreground"
						>
							Trang chủ ↗
						</a>
						<span className="text-border">·</span>
						<a href={routes.learn} className="text-[11px] text-muted transition-colors hover:text-foreground">
							Học tập
						</a>
					</div>
				)}

				{session?.user && (
					<div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
						{session.user.image ? (
							<img
								src={session.user.image}
								alt=""
								className="h-7 w-7 shrink-0 rounded-full object-cover"
							/>
						) : (
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-black text-background">
								{(session.user.name ?? 'A')[0].toUpperCase()}
							</div>
						)}
						{!collapsed && (
							<div className="min-w-0 flex-1">
								<p className="truncate text-xs font-bold text-foreground">{session.user.name ?? 'Admin'}</p>
								<button
									type="button"
									onClick={() => void signOut({ callbackUrl: routes.home })}
									className="min-h-10 text-[10px] text-muted transition-colors hover:text-error"
								>
									Đăng xuất
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}

/** Responsive admin chrome: drawer below md, fixed sidebar from md. */
export default function AdminSidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const drawerId = useId();
	const pathname = usePathname();

	const closeDrawer = useCallback(() => setDrawerOpen(false), []);

	// Close drawer on navigation without syncing in an effect:
	const drawerKey = pathname;
	const [navPath, setNavPath] = useState(pathname);
	if (navPath !== drawerKey) {
		setNavPath(drawerKey);
		if (drawerOpen) setDrawerOpen(false);
	}

	useEffect(() => {
		if (!drawerOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') closeDrawer();
		}
		function onResize() {
			if (window.matchMedia('(min-width: 768px)').matches) closeDrawer();
		}
		document.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		return () => {
			document.body.style.overflow = prev;
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
		};
	}, [drawerOpen, closeDrawer]);

	return (
		<>
			{/* Mobile top app bar */}
			<header className="sticky top-0 z-40 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-surface px-3 md:hidden">
				<button
					type="button"
					className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-hover"
					aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
					aria-expanded={drawerOpen}
					aria-controls={drawerId}
					onClick={() => setDrawerOpen((v) => !v)}
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
						{drawerOpen ? (
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						) : (
							<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						)}
					</svg>
				</button>
				<Link href={routes.admin.home} className="font-display text-base font-semibold tracking-wide text-foreground">
					Admin
				</Link>
			</header>

			{/* Mobile drawer */}
			{drawerOpen ? (
				<div className="fixed inset-0 z-50 md:hidden" role="presentation">
					<button
						type="button"
						className="absolute inset-0 bg-ink/40"
						aria-label="Đóng menu"
						onClick={closeDrawer}
					/>
					<aside
						id={drawerId}
						role="dialog"
						aria-modal="true"
						aria-label="Menu quản trị"
						className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col border-r border-border bg-surface shadow-lg"
					>
						<div className="flex h-14 items-center justify-between border-b border-border px-3">
							<span className="text-sm font-black uppercase tracking-wider">Admin</span>
							<button
								type="button"
								onClick={closeDrawer}
								className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-hover"
								aria-label="Đóng"
							>
								×
							</button>
						</div>
						<NavBody collapsed={false} onNavigate={closeDrawer} />
					</aside>
				</div>
			) : null}

			{/* Desktop sidebar */}
			<aside
				className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 md:flex ${
					collapsed ? 'w-14' : 'w-56'
				}`}
			>
				<div className="flex h-14 items-center justify-between border-b border-border px-3">
					{!collapsed ? (
						<Link
							href={routes.admin.home}
							className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wider text-foreground"
						>
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground">
								<span className="text-[11px] font-black text-background">H</span>
							</div>
							Admin
						</Link>
					) : (
						<Link href={routes.admin.home} className="mx-auto" aria-label="Admin">
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
								<span className="text-[11px] font-black text-background">H</span>
							</div>
						</Link>
					)}
					<button
						type="button"
						onClick={() => setCollapsed((v) => !v)}
						className={`flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${collapsed ? 'mx-auto' : ''}`}
						aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
					>
						<svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
							{collapsed ? (
								<path d="M6 3l5 5-5 5M3 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							) : (
								<path d="M10 3L5 8l5 5M13 8H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							)}
						</svg>
					</button>
				</div>
				<NavBody collapsed={collapsed} />
			</aside>
		</>
	);
}
