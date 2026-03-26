'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';
import { NAV_LINKS } from '@/config/navigation';
import { timeAgo } from '@/utils/formatDate';

interface NotificationItem {
	id: string;
	type: string;
	message: string;
	href: string;
	read: boolean;
	createdAt: string;
}

function NotifIcon({ type }: { type: string }) {
	if (type.startsWith('comment')) {
		return (
			<svg className="h-3.5 w-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
			</svg>
		);
	}
	return (
		<svg className="h-3.5 w-3.5 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
		</svg>
	);
}

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, status } = useSession();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);

	// Close dropdowns when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
			if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
				setNotifOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const fetchNotifications = useCallback(async () => {
		if (!session?.user) return;
		try {
			const res = await fetch('/api/notifications');
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { items?: NotificationItem[]; unreadCount?: number } }).data;
				if (data?.items) setNotifications(data.items.slice(0, 15));
				if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
			}
		} catch { /* ignore */ }
	}, [session]);

	// Poll every 30s when user is logged in
	useEffect(() => {
		if (!session?.user) return;
		void fetchNotifications();
		const interval = setInterval(() => void fetchNotifications(), 30000);
		return () => clearInterval(interval);
	}, [session, fetchNotifications]);

	async function markAllRead() {
		try {
			await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			setUnreadCount(0);
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		} catch { /* ignore */ }
	}

	async function handleNotifClick(notif: NotificationItem) {
		setNotifOpen(false);
		// Mark individual as read
		if (!notif.read) {
			try {
				await fetch('/api/notifications', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ notificationId: notif.id }),
				});
				setUnreadCount((v) => Math.max(0, v - 1));
				setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
			} catch { /* ignore */ }
		}
		router.push(notif.href);
	}

	return (
		<header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2.5">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
						<span className="text-xs font-black text-background">H</span>
					</div>
					<span className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">HANOICAM</span>
				</Link>

				{/* Desktop Navigation */}
				<nav className="flex items-center gap-1">
					{/* Desktop links */}
					<div className="hidden sm:flex sm:items-center sm:gap-1">
						{NAV_LINKS.map(({ href, label }) => {
							const active = pathname === href || pathname.startsWith(href + '/');
							return (
								<Link
									key={href}
									className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
										active ? 'text-foreground' : 'text-muted hover:text-foreground'
									}`}
									href={href}
								>
									{label}
								</Link>
							);
						})}
					</div>

					{/* Theme Toggle */}
					<div className="ml-1">
						<ThemeToggle />
					</div>

					{/* Notification Bell — logged-in users only */}
					{session?.user && (
						<div ref={notifRef} className="relative ml-1">
							<button
								type="button"
								onClick={() => {
									setNotifOpen((v) => !v);
									if (!notifOpen) void fetchNotifications();
								}}
								className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-hover focus:outline-none"
								aria-label="Thông báo"
							>
								<svg className="h-4.5 w-4.5 text-foreground-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
								</svg>
								{unreadCount > 0 && (
									<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
										{unreadCount > 9 ? '9+' : unreadCount}
									</span>
								)}
							</button>

							{/* Notification Dropdown */}
							{notifOpen && (
								<div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
									<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
										<p className="text-xs font-bold uppercase tracking-widest text-foreground">
											Thông báo {unreadCount > 0 && <span className="text-accent">({unreadCount})</span>}
										</p>
										{unreadCount > 0 && (
											<button
												onClick={() => void markAllRead()}
												className="text-[10px] text-muted underline underline-offset-2 hover:text-foreground"
											>
												Đọc tất cả
											</button>
										)}
									</div>
									{notifications.length === 0 ? (
										<p className="px-4 py-6 text-center text-xs text-muted">Không có thông báo nào.</p>
									) : (
										<div className="max-h-80 overflow-y-auto">
											{notifications.map((n) => (
												<button
													key={n.id}
													onClick={() => void handleNotifClick(n)}
													className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
														!n.read ? 'bg-accent/5' : ''
													}`}
												>
													<div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-hover">
														<NotifIcon type={n.type} />
													</div>
													<div className="min-w-0 flex-1">
														<p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-foreground' : 'text-foreground-secondary'}`}>
															{n.message}
														</p>
														<p className="mt-0.5 text-[10px] text-muted">{timeAgo(n.createdAt)}</p>
													</div>
													{!n.read && (
														<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
													)}
												</button>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Auth: Login button or User avatar */}
					<div className="ml-1">
						{status === 'loading' ? (
							<div className="h-8 w-8 animate-pulse rounded-full bg-surface-hover" />
						) : session?.user ? (
							<div ref={userMenuRef} className="relative">
								<button
									type="button"
									onClick={() => setUserMenuOpen((v) => !v)}
									className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-border transition-shadow hover:ring-accent focus:outline-none focus:ring-accent"
									aria-label="Menu người dùng"
								>
									{session.user.image ? (
										<img
											src={session.user.image}
											alt={session.user.name ?? 'Avatar'}
											className="h-full w-full object-cover"
											referrerPolicy="no-referrer"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-foreground text-xs font-black text-background">
											{(session.user.name ?? 'U')[0].toUpperCase()}
										</div>
									)}
								</button>

								{/* Dropdown menu */}
								{userMenuOpen && (
									<div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
										<div className="border-b border-border px-4 py-3">
											<p className="truncate text-sm font-bold text-foreground">{session.user.name}</p>
											<p className="truncate text-xs text-muted">{session.user.email}</p>
										</div>
										<div className="py-1">
											<Link
												href="/dashboard"
												onClick={() => setUserMenuOpen(false)}
												className="block px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
											>
												Dashboard
											</Link>
											<Link
												href="/profile"
												onClick={() => setUserMenuOpen(false)}
												className="block px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
											>
												Hồ sơ
											</Link>
											<Link
												href="/vocabulary"
												onClick={() => setUserMenuOpen(false)}
												className="block px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
											>
												Từ vựng
											</Link>
											{session.user.role === 'admin' && (
												<Link
													href="/admin"
													onClick={() => setUserMenuOpen(false)}
													className="block px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
												>
													Quản trị
												</Link>
											)}
										</div>
										<div className="border-t border-border py-1">
											<button
												type="button"
												onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }); }}
												className="block w-full px-4 py-2 text-left text-sm text-error transition-colors hover:bg-surface-hover"
											>
												Đăng xuất
											</button>
										</div>
									</div>
								)}
							</div>
						) : (
							<Link
								href="/login"
								className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
							>
								<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
								</svg>
								Đăng nhập
							</Link>
						)}
					</div>

					{/* Mobile hamburger */}
					<button
						type="button"
						className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surface-hover sm:hidden"
						onClick={() => setMobileOpen((v) => !v)}
						aria-label="Menu"
					>
						{mobileOpen ? (
							<svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
							</svg>
						)}
					</button>
				</nav>
			</div>

			{/* Mobile menu */}
			{mobileOpen ? (
				<div className="border-t border-border/60 px-6 pb-3 pt-2 sm:hidden">
					{NAV_LINKS.map(({ href, label }) => {
						const active = pathname === href || pathname.startsWith(href + '/');
						return (
							<Link
								key={href}
								className={`block py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
									active ? 'text-foreground' : 'text-muted hover:text-foreground'
								}`}
								href={href}
								onClick={() => setMobileOpen(false)}
							>
								{label}
							</Link>
						);
					})}

					{/* Mobile auth links */}
					{session?.user ? (
						<>
							<Link
								href="/dashboard"
								onClick={() => setMobileOpen(false)}
								className="block py-2 text-sm font-bold uppercase tracking-widest text-muted hover:text-foreground"
							>
								Dashboard
							</Link>
							<Link
								href="/profile"
								onClick={() => setMobileOpen(false)}
								className="block py-2 text-sm font-bold uppercase tracking-widest text-muted hover:text-foreground"
							>
								Hồ sơ
							</Link>
							<button
								type="button"
								onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
								className="block py-2 text-sm font-bold uppercase tracking-widest text-error"
							>
								Đăng xuất
							</button>
						</>
					) : (
						<Link
							href="/login"
							onClick={() => setMobileOpen(false)}
							className="block py-2 text-sm font-bold uppercase tracking-widest text-muted hover:text-foreground"
						>
							Đăng nhập
						</Link>
					)}
				</div>
			) : null}
		</header>
	);
}

