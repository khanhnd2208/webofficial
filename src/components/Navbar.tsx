'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
	{ href: '/blog', label: 'Hanoicam Story' },
	{ href: '/vocabulary', label: 'Học tiếng Anh' },
	{ href: '/feedback', label: 'Phản hồi' },
];

export default function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	// Close user dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
		}
		if (userMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [userMenuOpen]);

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
					</div>

					{/* Theme Toggle */}
					<div className="ml-1">
						<ThemeToggle />
					</div>

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
