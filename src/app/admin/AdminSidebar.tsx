'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { AdminIcon } from '@/components/admin/AdminIcon';
import styles from '@/components/admin/AdminStudio.module.css';
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
	testId,
}: {
	href: string;
	label: string;
	icon: Parameters<typeof McIcon>[0]['name'];
	collapsed: boolean;
	active?: boolean;
	onNavigate?: () => void;
	testId?: string;
}) {
	return (
		<Link
			href={href}
			aria-label={collapsed ? label : undefined}
			aria-current={active ? 'page' : undefined}
			onClick={onNavigate}
			data-testid={testId}
			data-collapsed={collapsed}
			className={styles.navItem}
		>
			<McIcon name={icon} size={20} />
			<span className={collapsed ? styles.tooltip : 'truncate'}>{label}</span>
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
			<nav className={styles.nav} aria-label={archived ? 'Kho lưu trữ' : 'Quản trị'}>
				<NavItem
					href={archived ? routes.admin.archive : routes.admin.home}
					label={archived ? 'Kho lưu trữ' : 'Tổng quan'}
					icon="dashboard"
					collapsed={collapsed}
					active={pathname === (archived ? routes.admin.archive : routes.admin.home)}
					onNavigate={onNavigate}
				/>
				{groups.map(({ group, items }) => (
					<div key={group} className="mt-5">
						{!collapsed && <p className={`${styles.meta} mb-2 px-3`}>{group}</p>}
						{items.map((item) => (
							<NavItem
								key={item.href}
								{...item}
								collapsed={collapsed}
								active={isAdminNavActive(pathname, item.href, item.exact)}
								onNavigate={onNavigate}
							/>
						))}
					</div>
				))}
				<div className="mt-6 border-t border-border pt-4">
					<NavItem
						href={archived ? routes.admin.home : routes.admin.archive}
						label={archived ? 'Về admin chính' : 'Kho lưu trữ'}
						icon={archived ? 'arrow_back' : 'archive'}
						collapsed={collapsed}
						onNavigate={onNavigate}
						testId={archived ? 'archive-sidebar-back' : 'admin-archive-link'}
					/>
					<NavItem
						href={routes.mySpaceTeaching}
						label="Mở Teaching"
						icon="school"
						collapsed={collapsed}
						onNavigate={onNavigate}
					/>
					<NavItem
						href={routes.toc}
						label="Về Mục lục"
						icon="menu_book"
						collapsed={collapsed}
						onNavigate={onNavigate}
					/>
				</div>
			</nav>
			<div className={styles.account}>
				{session?.user && (
					<>
						<div
							className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}
							title={session.user.name ?? 'Admin'}
						>
							<span className={styles.iconTile} aria-hidden="true">
								{(session.user.name ?? 'A')[0].toUpperCase()}
							</span>
							{!collapsed && (
								<div className="min-w-0">
									<p className="truncate font-semibold">{session.user.name ?? 'Admin'}</p>
									<p className={styles.meta}>Quản trị viên</p>
								</div>
							)}
						</div>
						<button
							type="button"
							aria-label="Đăng xuất"
							title="Đăng xuất"
							onClick={() => void signOut({ callbackUrl: routes.home })}
							className={`${styles.navItem} w-full`}
							data-collapsed={collapsed}
						>
							<AdminIcon name="logout" />
							{!collapsed && <span>Đăng xuất</span>}
							{collapsed && <span className={styles.tooltip}>Đăng xuất</span>}
						</button>
					</>
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
	useEffect(() => {
		try {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate a browser-only preference after SSR
			setCollapsed(localStorage.getItem('admin-sidebar-collapsed') === 'true');
		} catch {
			/* Storage may be unavailable in a private browser. */
		}
	}, []);
	function toggleCollapsed() {
		const next = !collapsed;
		setCollapsed(next);
		try {
			localStorage.setItem('admin-sidebar-collapsed', String(next));
		} catch {
			/* Keep the in-memory preference. */
		}
	}

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
			if (window.matchMedia('(min-width: 1024px)').matches) closeDrawer();
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
			<header className={styles.mobileBar}>
				<button
					ref={menuButtonRef}
					type="button"
					className={`${styles.button} ${styles.quiet} !px-3`}
					aria-label={drawerOpen ? 'Đóng menu' : 'Mở menu'}
					aria-expanded={drawerOpen}
					aria-controls={drawerId}
					data-testid="admin-menu-button"
					onClick={() => setDrawerOpen((v) => !v)}
				>
					<McIcon name="menu" size={20} />
				</button>
				<Link href={brandHref} className="font-semibold">
					{brandLabel} Studio
				</Link>
			</header>
			{drawerOpen && (
				<div className={styles.drawerLayer} role="presentation">
					<button
						type="button"
						className={styles.scrim}
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
						className={styles.drawer}
					>
						<div className={styles.brand}>
							<span className="font-semibold">{brandLabel} Studio</span>
							<button
								type="button"
								onClick={closeDrawer}
								className={`${styles.button} ${styles.quiet} !px-3`}
								aria-label="Đóng"
							>
								<McIcon name="close" size={20} />
							</button>
						</div>
						<NavBody collapsed={false} onNavigate={closeDrawer} />
					</aside>
				</div>
			)}
			<aside className={styles.sidebar} data-collapsed={collapsed}>
				<div className={styles.brand}>
					{!collapsed && (
						<Link href={brandHref} className="font-semibold">
							{brandLabel} Studio
						</Link>
					)}
					<button
						type="button"
						onClick={toggleCollapsed}
						className={`${styles.button} ${styles.quiet} !px-3 ${collapsed ? 'mx-auto' : ''}`}
						aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
						title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
					>
						<McIcon name={collapsed ? 'chevron_right' : 'chevron_left'} size={20} />
					</button>
				</div>
				<NavBody collapsed={collapsed} />
			</aside>
		</>
	);
}
