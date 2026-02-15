'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

function initialsFromName(name: string | null | undefined) {
	const text = (name ?? '').trim();
	if (!text) return 'U';
	const parts = text.split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? 'U';
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
	return `${first}${last}`.toUpperCase();
}

const NAV_LINKS = [
	{ href: '/blog', label: 'Blog' },
	{ href: '/vocabulary', label: 'Từ vựng', authRequired: true },
];

export default function Navbar() {
	const { data, status } = useSession();
	const user = data?.user;
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close dropdown on route change
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => { setMenuOpen(false); }, [pathname]);

	// Close dropdown on click outside
	useEffect(() => {
		if (!menuOpen) return;
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		function handleKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setMenuOpen(false);
		}
		document.addEventListener('mousedown', handleClick);
		document.addEventListener('keydown', handleKey);
		return () => {
			document.removeEventListener('mousedown', handleClick);
			document.removeEventListener('keydown', handleKey);
		};
	}, [menuOpen]);

	const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

	return (
		<header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
						<span className="text-xs font-black text-background">N</span>
					</div>
					<span className="text-sm font-bold uppercase tracking-widest text-foreground">NDK</span>
				</Link>

				{/* Navigation */}
				<nav className="flex items-center gap-1">
					{NAV_LINKS.map(({ href, label, authRequired }) => {
						const active = pathname === href || pathname.startsWith(href + '/');
						// If auth required and not logged in, link to login with redirect
						const linkHref = authRequired && !user ? `/login?from=${href}` : href;
						return (
							<Link
								key={href}
								className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
									active
										? 'text-foreground'
										: 'text-muted hover:text-foreground'
								}`}
								href={linkHref}
							>
								{label}
							</Link>
						);
					})}

					{/* Theme Toggle */}
					<div className="ml-1">
						<ThemeToggle />
					</div>

					{/* User area */}
					{status === 'loading' ? (
						<div className="ml-1 h-8 w-8 animate-pulse rounded-full bg-surface-hover" />
					) : user ? (
						/* ── Logged in: Avatar dropdown ── */
						<div className="relative ml-1" ref={menuRef}>
							<button
								type="button"
								onClick={toggleMenu}
								className="flex cursor-pointer items-center gap-1 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-border"
								aria-expanded={menuOpen}
								aria-haspopup="true"
							>
								<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
									{user.image ? (
										<img
											src={user.image}
											alt={user.name ?? 'Avatar'}
											className="h-full w-full object-cover"
											referrerPolicy="no-referrer"
										/>
									) : (
										<span className="text-[10px] font-black">{initialsFromName(user.name)}</span>
									)}
								</div>
							</button>

							{menuOpen ? (
								<div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
									{/* User info */}
									<div className="px-3 py-2.5">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
												{user.image ? (
													<img
														src={user.image}
														alt={user.name ?? 'Avatar'}
														className="h-full w-full object-cover"
														referrerPolicy="no-referrer"
													/>
												) : (
													<span className="text-xs font-black">{initialsFromName(user.name)}</span>
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm font-bold text-foreground">{user.name ?? 'User'}</div>
												<div className="truncate text-[11px] text-muted">{user.email}</div>
											</div>
										</div>
									</div>

									<div className="my-1 h-px bg-border" />

									{/* Dashboard link */}
									<Link
										className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
										href="/dashboard"
										onClick={() => setMenuOpen(false)}
									>
										<svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
										</svg>
										Dashboard
									</Link>

									{/* Vocabulary link */}
									<Link
										className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
										href="/vocabulary"
										onClick={() => setMenuOpen(false)}
									>
										<svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
										</svg>
										Từ vựng
									</Link>

									{user.role === 'admin' ? (
										<>
											<div className="my-1 h-px bg-border" />
											<Link
												className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
												href="/admin"
												onClick={() => setMenuOpen(false)}
											>
												<svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
													<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												Admin
											</Link>
										</>
									) : null}

									<div className="my-1 h-px bg-border" />

									<button
										type="button"
										onClick={() => {
											setMenuOpen(false);
											signOut({ callbackUrl: '/' });
										}}
										className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-error transition-colors hover:bg-error-subtle"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
										</svg>
										Đăng xuất
									</button>
								</div>
							) : null}
						</div>
					) : (
						/* ── Not logged in: Login button ── */
						<Link
							className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-95"
							href="/login"
						>
							<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
							</svg>
							Đăng nhập
						</Link>
					)}
				</nav>
			</div>
		</header>
	);
}
