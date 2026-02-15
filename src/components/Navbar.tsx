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
];

const AUTH_NAV_LINKS = [
	{ href: '/vocabulary', label: 'Từ vựng' },
	{ href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
	const { data } = useSession();
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
				<Link
					href="/"
					className="flex items-center gap-2"
				>
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
						<span className="text-xs font-black text-background">N</span>
					</div>
					<span className="text-sm font-bold uppercase tracking-widest text-foreground">NDK</span>
				</Link>

				{/* Navigation */}
				<nav className="flex items-center gap-1">
					{NAV_LINKS.map(({ href, label }) => {
						const active = pathname === href || pathname.startsWith(href + '/');
						return (
							<Link
								key={href}
								className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
									active
										? 'text-foreground'
										: 'text-muted hover:text-foreground'
								}`}
								href={href}
							>
								{label}
							</Link>
						);
					})}

					{user
						? AUTH_NAV_LINKS.map(({ href, label }) => {
								const active = pathname === href || pathname.startsWith(href + '/');
								return (
									<Link
										key={href}
										className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
											active
												? 'text-foreground'
												: 'text-muted hover:text-foreground'
										}`}
										href={href}
									>
										{label}
									</Link>
								);
						  })
						: null}

					{/* Theme Toggle */}
					<div className="ml-2 hidden sm:block">
						<ThemeToggle />
					</div>

					{/* User Menu — click-outside-close dropdown */}
					{user ? (
						<div className="relative ml-2" ref={menuRef}>
							<button
								type="button"
								onClick={toggleMenu}
								className="flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 transition-all hover:bg-surface-hover"
								aria-expanded={menuOpen}
								aria-haspopup="true"
							>
								<div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-foreground text-background">
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
								<svg className={`h-3 w-3 text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{menuOpen ? (
								<div className="absolute right-0 mt-2 w-52 origin-top-right animate-in fade-in slide-in-from-top-1 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg">
									<div className="px-3 py-2">
										<div className="text-sm font-bold text-foreground">{user.name ?? 'User'}</div>
										<div className="text-xs text-muted">{user.email}</div>
									</div>
									<div className="my-1 h-px bg-border" />

									{user.role === 'admin' ? (
										<>
											<Link
												className="flex items-center rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
												href="/admin"
												onClick={() => setMenuOpen(false)}
											>
												Admin
											</Link>
											<div className="my-1 h-px bg-border" />
										</>
									) : null}

									<button
										type="button"
										onClick={() => {
											setMenuOpen(false);
											signOut({ callbackUrl: '/' });
										}}
										className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-error transition-colors hover:bg-error-subtle"
									>
										Đăng xuất
									</button>
								</div>
							) : null}
						</div>
					) : (
						<Link
							className="ml-3 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground"
							href="/login"
						>
							Menu
							<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</Link>
					)}
				</nav>
			</div>
		</header>
	);
}
