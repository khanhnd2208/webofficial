'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

/* ─── Nav structure ─────────────────────────────────────────── */
const NAV = [
	{
		group: 'Nội dung',
		items: [
			{
				href: '/admin/posts',
				label: 'Blog',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<path d="M4 4.5A1.5 1.5 0 015.5 3h9A1.5 1.5 0 0116 4.5v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 15.5V4.5z" stroke="currentColor" strokeWidth="1.4" />
						<path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
					</svg>
				),
			},
		],
	},
	{
		group: 'Từ vựng',
		items: [
			{
				href: '/admin/vocabulary',
				label: 'Cửa hàng từ vựng',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<path d="M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5V4.5z" stroke="currentColor" strokeWidth="1.4" />
						<path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
					</svg>
				),
			},
		],
	},
	{
		group: 'Cộng đồng',
		items: [
			{
				href: '/admin/users',
				label: 'Người dùng',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
						<path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
						<path d="M14 5c1.105 0 2 .895 2 2s-.895 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
						<path d="M16 14.5c1.333.5 2 1.5 2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
					</svg>
				),
			},
			{
				href: '/admin/posts/comments',
				label: 'Bình luận',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<path d="M10 2C5.03 2 1 5.36 1 9.5c0 2.06.9 3.93 2.36 5.3-.18.9-.65 1.84-1.36 2.5 1.35-.07 2.76-.55 3.85-1.33C7.16 16.63 8.54 17 10 17c4.97 0 9-3.36 9-7.5S14.97 2 10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
					</svg>
				),
				badge: 'comments',
			},
			{
				href: '/admin/feedback/messages',
				label: 'Hộp thư phản hồi',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<path d="M2 4.5C2 3.67 2.67 3 3.5 3h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C2.67 15 2 14.33 2 13.5v-9z" stroke="currentColor" strokeWidth="1.4" />
						<path d="M2 4.5l8 5.25L18 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
					</svg>
				),
				badge: 'messages',
			},
		],
	},
	{
		group: 'Công cụ',
		items: [
			{
				href: '/admin/tools',
				label: 'Magical Tools',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<path d="M10 2l2.09 4.26L17 7.27l-3.5 3.42L14.18 16 10 13.77 5.82 16l.68-5.31L3 7.27l4.91-.71L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
					</svg>
				),
			},
			{
				href: '/admin/personality-test',
				label: 'Personality Report',
				icon: (
					<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
						<rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
						<path d="M6 13.5l2.5-3 2 2 2.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
						<circle cx="14.5" cy="5.5" r="1.5" fill="currentColor" />
					</svg>
				),
			},
		],
	},
] as const;

interface AdminSidebarProps {
	pendingCount?: number;
	pendingCommentCount?: number;
}

export default function AdminSidebar({ pendingCount = 0, pendingCommentCount = 0 }: AdminSidebarProps) {
	const pathname = usePathname();
	const { data: session } = useSession();
	const [collapsed, setCollapsed] = useState(false);

	function isActive(href: string) {
		if (href === '/admin') return pathname === '/admin';
		return pathname.startsWith(href);
	}

	return (
		<aside
			className={`group flex h-screen flex-col border-r border-border bg-surface transition-all duration-200 ${
				collapsed ? 'w-14' : 'w-56'
			} sticky top-0 shrink-0`}
		>
			{/* Logo / Brand */}
			<div className="flex h-14 items-center justify-between border-b border-border px-3">
				{!collapsed && (
					<Link
						href="/admin"
						className="flex items-center gap-2.5 font-black uppercase tracking-wider text-foreground text-sm"
					>
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground">
							<span className="text-[11px] font-black text-background">H</span>
						</div>
						Admin
					</Link>
				)}
				{collapsed && (
					<Link href="/admin" className="mx-auto">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
							<span className="text-[11px] font-black text-background">H</span>
						</div>
					</Link>
				)}
				<button
					onClick={() => setCollapsed((v) => !v)}
					className={`flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${collapsed ? 'mx-auto mt-0' : ''}`}
					title={collapsed ? 'Mở rộng' : 'Thu gọn'}
				>
					<svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
						{collapsed ? (
							<path d="M6 3l5 5-5 5M3 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						) : (
							<path d="M10 3L5 8l5 5M13 8H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
						)}
					</svg>
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
				{/* Overview link */}
				<div>
					<NavItem
						href="/admin"
						label="Tổng quan"
						collapsed={collapsed}
						active={isActive('/admin') && pathname === '/admin'}
						icon={
							<svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
								<rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
								<rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
							</svg>
						}
					/>
				</div>

				{/* Grouped sections */}
				{NAV.map(({ group, items }) => (
					<div key={group}>
						{!collapsed && (
							<p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted/70">
								{group}
							</p>
						)}
						<div className="space-y-0.5">
						{items.map((item) => {
							const badgeVal = 'badge' in item
								? item.badge === 'messages' && pendingCount > 0 ? pendingCount
								: item.badge === 'comments' && pendingCommentCount > 0 ? pendingCommentCount
								: undefined
								: undefined;
							return (
								<NavItem
									key={item.href}
									href={item.href}
									label={item.label}
									collapsed={collapsed}
									active={isActive(item.href)}
									icon={item.icon}
									badge={badgeVal}
								/>
							);
						})}
						</div>
					</div>
				))}
			</nav>

			{/* Bottom: quick links + user */}
			<div className="border-t border-border p-2 space-y-1">
				{!collapsed && (
					<div className="px-2 pb-2 flex items-center gap-2">
						<a
							href="/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[11px] text-muted hover:text-foreground transition-colors"
						>
							Trang chủ ↗
						</a>
						<span className="text-border">·</span>
						<a
							href="/blog"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[11px] text-muted hover:text-foreground transition-colors"
						>
							Blog ↗
						</a>
						<span className="text-border">·</span>
						<a
							href="/dashboard"
							className="text-[11px] text-muted hover:text-foreground transition-colors"
						>
							Dashboard
						</a>
					</div>
				)}

				{/* User avatar + signout */}
				{session?.user && (
					<div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
						{session.user.image ? (
							<img
								src={session.user.image}
								alt={session.user.name ?? ''}
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
									onClick={() => void signOut({ callbackUrl: '/' })}
									className="text-[10px] text-muted transition-colors hover:text-error"
								>
									Đăng xuất
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</aside>
	);
}

function NavItem({
	href,
	label,
	icon,
	collapsed,
	active,
	badge,
}: {
	href: string;
	label: string;
	icon: React.ReactNode;
	collapsed: boolean;
	active: boolean;
	badge?: number;
}) {
	return (
		<Link
			href={href}
			title={collapsed ? label : undefined}
			className={`relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
				active
					? 'bg-foreground text-background font-semibold'
					: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
			} ${collapsed ? 'justify-center' : ''}`}
		>
			{/* Icon with pulsing dot when collapsed and has unread badge */}
			<span className="relative shrink-0">
				{icon}
				{badge !== undefined && badge > 0 && collapsed && (
					<span className="absolute -right-1 -top-1 flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
					</span>
				)}
			</span>
			{!collapsed && <span className="truncate">{label}</span>}
			{badge !== undefined && badge > 0 && !collapsed && (
				<span
					className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
						active ? 'bg-background text-foreground' : 'bg-red-500 text-white'
					}`}
				>
					{badge > 99 ? '99+' : badge}
				</span>
			)}
		</Link>
	);
}
