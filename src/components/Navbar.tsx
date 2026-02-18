'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
	{ href: '/blog', label: 'Chapters' },
];

export default function Navbar() {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

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
				</div>
			) : null}
		</header>
	);
}
