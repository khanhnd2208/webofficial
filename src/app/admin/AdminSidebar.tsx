'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { AdminIcon, type AdminIconName } from '@/components/admin/AdminIcon';
import styles from '@/components/admin/AdminStudio.module.css';
import { McIcon, type McIconName } from '@/components/myclass/ui/McIcon';
import { getAdminNavGroupsForPath, isAdminNavActive } from '@/config/adminNavigation';
import { isArchivedAdminPath } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';
import { signOutTo } from '@/lib/auth/signOutTo';

const SIDEBAR_COOKIE = 'admin-sidebar-collapsed';

const ADMIN_NAV_ICONS: Record<string, AdminIconName> = {
	[routes.admin.home]: 'overview',
	[routes.admin.archive]: 'archive',
	[routes.admin.website]: 'website',
	[routes.admin.inquiries]: 'inbox',
	[routes.admin.learnAnalytics]: 'analytics',
	[routes.mySpaceTeaching]: 'teaching',
};

function NavItem({
	href,
	label,
	icon,
	mark,
	collapsed,
	active,
	count,
	leavesAdmin,
	onNavigate,
	testId,
}: {
	href: string;
	label: string;
	icon: McIconName;
	mark?: AdminIconName;
	collapsed: boolean;
	active?: boolean;
	count?: number;
	leavesAdmin?: boolean;
	onNavigate?: () => void;
	testId?: string;
}) {
	const adminIcon = mark ?? ADMIN_NAV_ICONS[href];
	const counted = count ? count.toLocaleString('vi-VN') : null;
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
			{adminIcon ? <AdminIcon name={adminIcon} size={20} /> : <McIcon name={icon} size={20} />}
			<span className={collapsed ? styles.tooltip : 'min-w-0 flex-1 truncate'}>{label}</span>
			{counted ? (
				<span className={collapsed ? styles.navDot : styles.navCount}>
					<span className={collapsed ? 'sr-only' : undefined}>{counted}</span>
					<span className="sr-only"> mới</span>
				</span>
			) : null}
			{leavesAdmin && !collapsed ? (
				<span className={styles.navExit} title="Mở ngoài trang quản trị">
					<AdminIcon name="external" size={14} />
					<span className="sr-only"> (ngoài trang quản trị)</span>
				</span>
			) : null}
		</Link>
	);
}

function NavBody({
	collapsed,
	counts,
	onNavigate,
}: {
	collapsed: boolean;
	counts: Partial<Record<string, number>>;
	onNavigate?: () => void;
}) {
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
						{collapsed ? (
							<div className="mx-3 mb-2 border-t border-border" aria-hidden="true" />
						) : (
							<p className={styles.navGroup}>{group}</p>
						)}
						{items.map((item) => (
							<NavItem
								key={item.href}
								{...item}
								count={counts[item.href]}
								collapsed={collapsed}
								active={!item.leavesAdmin && isAdminNavActive(pathname, item.href, item.exact)}
								onNavigate={onNavigate}
							/>
						))}
					</div>
				))}
			</nav>
			<div className={styles.account}>
				<NavItem
					href={archived ? routes.admin.home : routes.admin.archive}
					label={archived ? 'Về Tổng quan' : 'Kho lưu trữ'}
					icon="arrow_back"
					mark={archived ? 'back' : 'archive'}
					collapsed={collapsed}
					onNavigate={onNavigate}
					testId={archived ? 'archive-sidebar-back' : 'admin-archive-link'}
				/>
				<NavItem
					href={routes.toc}
					label="Xem website"
					icon="open_in_new"
					mark="toc"
					leavesAdmin
					collapsed={collapsed}
					onNavigate={onNavigate}
				/>
				{session?.user && (
					<div className="mt-2 border-t border-border pt-2">
						<div
							className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}
							title={session.user.name ?? 'Admin'}
						>
							<span className={styles.avatar} aria-hidden="true">
								{(session.user.name ?? 'A')[0].toUpperCase()}
							</span>
							{!collapsed && (
								<div className="min-w-0">
									<p className="truncate font-semibold">{session.user.name ?? 'Admin'}</p>
									<p className={`${styles.meta} truncate`}>
										{session.user.email ?? 'Quản trị viên'}
									</p>
								</div>
							)}
						</div>
						<button
							type="button"
							aria-label="Đăng xuất"
							title="Đăng xuất"
							onClick={() => void signOutTo(routes.home)}
							className={`${styles.navItem} w-full`}
							data-collapsed={collapsed}
						>
							<AdminIcon name="logout" />
							{!collapsed && <span>Đăng xuất</span>}
							{collapsed && <span className={styles.tooltip}>Đăng xuất</span>}
						</button>
					</div>
				)}
			</div>
		</>
	);
}

/** Responsive admin chrome: drawer below 1024px, fixed sidebar from 1024px. */
export default function AdminSidebar({
	initialCollapsed = false,
	newInquiries = 0,
}: {
	initialCollapsed?: boolean;
	/** NEW contact messages, shown as a count on the inbox entry. */
	newInquiries?: number;
}) {
	const counts = { [routes.admin.inquiries]: newInquiries };
	const [collapsed, setCollapsed] = useState(initialCollapsed);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const drawerId = useId();
	const pathname = usePathname();
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const drawerRef = useRef<HTMLElement>(null);

	const closeDrawer = useCallback(() => setDrawerOpen(false), []);
	function toggleCollapsed() {
		const next = !collapsed;
		setCollapsed(next);
		document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'}; Path=/admin; Max-Age=31536000; SameSite=Lax`;
	}

	const archived = isArchivedAdminPath(pathname);
	const brandHref = archived ? routes.admin.archive : routes.admin.home;
	const brandLabel = archived ? 'Kho lưu trữ' : 'Quản trị';

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
					{brandLabel}
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
							<span className="font-semibold">{brandLabel}</span>
							<button
								type="button"
								onClick={closeDrawer}
								className={`${styles.button} ${styles.quiet} !px-3`}
								aria-label="Đóng"
							>
								<McIcon name="close" size={20} />
							</button>
						</div>
						<NavBody collapsed={false} counts={counts} onNavigate={closeDrawer} />
					</aside>
				</div>
			)}
			<aside className={styles.sidebar} data-collapsed={collapsed}>
				<div className={styles.brand}>
					{!collapsed && (
						<Link href={brandHref} className="font-semibold">
							{brandLabel}
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
				<NavBody collapsed={collapsed} counts={counts} />
			</aside>
		</>
	);
}
