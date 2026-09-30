'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { McIcon } from '@/components/myclass/ui/McIcon';
import { getAdminNavGroupsForPath, isAdminNavActive } from '@/config/adminNavigation';
import { isArchivedAdminPath } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';

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
	icon: Parameters<typeof McIcon>[0]['name'];
	collapsed: boolean;
	active: boolean;
	onNavigate?: () => void;
}) {
	return (
		<Link
			href={href}
			title={collapsed ? label : undefined}
			aria-current={active ? 'page' : undefined}
			onClick={onNavigate}
			className={`relative flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
				active
					? 'bg-foreground font-semibold text-background'
					: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
			} ${collapsed ? 'justify-center' : ''}`}
		>
			<McIcon name={icon} size={16} className="shrink-0" />
			{!collapsed && <span className="truncate">{label}</span>}
		</Link>
	);
}

function NavBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
	const pathname = usePathname();
	const { data: session } = useSession();
	const archived = isArchivedAdminPath(pathname);
	const groups = getAdminNavGroupsForPath(pathname);

	return (
		<>
			<nav
				className="flex-1 space-y-5 overflow-y-auto px-2 py-4"
				aria-label={archived ? 'Kho lưu trữ' : 'Quản trị'}
			>
				<div>
					<NavItem
						href={archived ? routes.admin.archive : routes.admin.home}
						label={archived ? 'Kho lưu trữ' : 'Tổng quan'}
						collapsed={collapsed}
						active={archived ? pathname === routes.admin.archive : pathname === routes.admin.home}
						icon="dashboard"
						onNavigate={onNavigate}
					/>
				</div>

				{groups.map(({ group, items }) =>
					items.length === 0 ? null : (
						<div key={group}>
							{!collapsed && (
								<p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">
									{group}
								</p>
							)}
							<div className="space-y-0.5">
								{items.map((item) => (
									<NavItem
										key={item.href}
										href={item.href}
										label={item.label}
										collapsed={collapsed}
										active={isAdminNavActive(pathname, item.href, item.exact)}
										icon={item.icon}
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
					<div className="flex flex-col gap-1 px-2 pb-2">
						{archived ? (
							<Link
								href={routes.admin.home}
								className="text-[11px] font-semibold text-foreground-secondary transition-colors hover:text-foreground"
								data-testid="archive-sidebar-back"
							>
								← Về admin chính
							</Link>
						) : (
							<Link
								href={routes.admin.archive}
								className="text-[11px] text-muted/80 transition-colors hover:text-muted"
								data-testid="admin-archive-link"
							>
								Kho lưu trữ
							</Link>
						)}
						<a
							href={routes.home}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[11px] text-muted transition-colors hover:text-foreground"
						>
							Trang chủ ↗
						</a>
					</div>
				)}

				{session?.user && (
					<div
						className={`flex items-center gap-2 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}
					>
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
								<p className="truncate text-xs font-bold text-foreground">
									{session.user.name ?? 'Admin'}
								</p>
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
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const drawerRef = useRef<HTMLElement>(null);

	const closeDrawer = useCallback(() => setDrawerOpen(false), []);
	const archived = isArchivedAdminPath(pathname);
	const brandHref = archived ? routes.admin.archive : routes.admin.home;
	const brandLabel = archived ? 'Kho lưu trữ' : 'Admin';

	useEffect(() => {
		// Close the mobile drawer after navigation. Route is the source of truth;
		// an effect keeps this out of render-phase state updates.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- close on pathname change
		setDrawerOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!drawerOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const drawer = drawerRef.current;
		const menuButton = menuButtonRef.current;

		function focusable(root: HTMLElement): HTMLElement[] {
			return [
				...root.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
				),
			].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
		}

		const items = drawer ? focusable(drawer) : [];
		(items[0] ?? drawer)?.focus();

		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeDrawer();
				return;
			}
			if (e.key !== 'Tab' || !drawer) return;
			const cycle = focusable(drawer);
			if (cycle.length === 0) {
				e.preventDefault();
				return;
			}
			const first = cycle[0]!;
			const last = cycle[cycle.length - 1]!;
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
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
			menuButton?.focus();
		};
	}, [drawerOpen, closeDrawer]);

	return (
		<>
			<header className="sticky top-0 z-40 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-surface px-3 md:hidden">
				<button
					ref={menuButtonRef}
					type="button"
					className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-hover"
					aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
					aria-expanded={drawerOpen}
					aria-controls={drawerId}
					data-testid="admin-menu-button"
					onClick={() => setDrawerOpen((v) => !v)}
				>
					<McIcon name={drawerOpen ? 'close' : 'menu'} size={20} />
				</button>
				<Link
					href={brandHref}
					className="inline-flex min-h-11 items-center px-2 font-display text-base font-semibold tracking-wide text-foreground"
				>
					{brandLabel}
				</Link>
			</header>

			{drawerOpen ? (
				<div className="fixed inset-0 z-50 md:hidden" role="presentation">
					<button
						type="button"
						className="absolute inset-0 bg-ink/40"
						aria-label="Đóng menu"
						onClick={closeDrawer}
					/>
					<aside
						ref={drawerRef}
						id={drawerId}
						role="dialog"
						aria-modal="true"
						aria-label={archived ? 'Menu kho lưu trữ' : 'Menu quản trị'}
						tabIndex={-1}
						data-testid="admin-mobile-drawer"
						className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col border-r border-border bg-surface shadow-lg"
					>
						<div className="flex h-14 items-center justify-between border-b border-border px-3">
							<span className="text-sm font-black uppercase tracking-wider">{brandLabel}</span>
							<button
								type="button"
								onClick={closeDrawer}
								className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-hover"
								aria-label="Đóng"
							>
								<McIcon name="close" size={18} />
							</button>
						</div>
						<NavBody collapsed={false} onNavigate={closeDrawer} />
					</aside>
				</div>
			) : null}

			<aside
				className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 md:flex ${
					collapsed ? 'w-14' : 'w-56'
				}`}
			>
				<div className="flex h-14 items-center justify-between border-b border-border px-3">
					{!collapsed ? (
						<Link
							href={brandHref}
							className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wider text-foreground"
						>
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground">
								<span className="text-[11px] font-black text-background">H</span>
							</div>
							{brandLabel}
						</Link>
					) : (
						<Link href={brandHref} className="mx-auto" aria-label={brandLabel}>
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
						<McIcon name={collapsed ? 'chevron_right' : 'chevron_left'} size={16} />
					</button>
				</div>
				<NavBody collapsed={collapsed} />
			</aside>
		</>
	);
}
