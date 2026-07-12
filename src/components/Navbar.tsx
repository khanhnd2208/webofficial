'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import ThemeToggle from './ThemeToggle';
import { PUBLIC_NAV_LINKS, USER_MENU_LINKS } from '@/config/navigation';
import { routes } from '@/config/routes';
import { duration, ease } from '@/components/motion/tokens';

export default function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [homeWordmarkOwned, setHomeWordmarkOwned] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const mobilePanelRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const reduce = useReducedMotion();
	const isHome = pathname === routes.home;
	const isAdmin = pathname.startsWith('/admin');
	const isPublicMessage = pathname.startsWith('/m/');
	const isLessonFocus = pathname.includes('/bai/');
	const wordmarkOwned = !isHome || homeWordmarkOwned || !!reduce;

	useEffect(() => {
		function onMorph(e: Event) {
			const detail = (e as CustomEvent<{ owned: boolean }>).detail;
			setHomeWordmarkOwned(detail?.owned ?? true);
		}
		window.addEventListener('hanoicam:wordmark-morph', onMorph);
		return () => window.removeEventListener('hanoicam:wordmark-morph', onMorph);
	}, []);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setUserMenuOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const closeMobile = useCallback(() => {
		setMobileOpen(false);
		menuButtonRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!mobileOpen) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') closeMobile();
		}
		function onResize() {
			if (window.matchMedia('(min-width: 640px)').matches) {
				setMobileOpen(false);
			}
		}
		function onOrientation() {
			setMobileOpen(false);
		}
		document.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		window.addEventListener('orientationchange', onOrientation);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('orientationchange', onOrientation);
			document.body.style.overflow = prev;
		};
	}, [mobileOpen, closeMobile]);

	function isActive(href: string) {
		if (href === routes.home) return pathname === routes.home;
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	if (isAdmin || isPublicMessage) return null;

	const showBrand = wordmarkOwned;

	const brandHidden = isHome && !showBrand;

	return (
		<header
			className={`sticky top-0 z-50 border-b transition-[background,border-color] duration-300 ${
				isLessonFocus
					? 'border-transparent bg-canvas/95 backdrop-blur-md'
					: 'border-hairline/60 bg-canvas/90 backdrop-blur-xl'
			}`}
			style={{ minHeight: 'var(--header-height)' }}
		>
			<div className="shell flex items-center justify-between py-3.5 sm:py-4">
				<Link
					href={routes.home}
					tabIndex={brandHidden ? -1 : undefined}
					aria-hidden={brandHidden || undefined}
					aria-label="HANOICAM — trang chủ"
					className={`flex items-center gap-2.5 transition-[visibility,opacity] duration-300 ${
						brandHidden
							? 'invisible pointer-events-none opacity-0 max-lg:visible max-lg:pointer-events-auto max-lg:opacity-100'
							: 'visible opacity-100'
					}`}
				>
					<span className="font-display text-base font-semibold tracking-[0.1em] text-ink sm:text-lg sm:tracking-[0.12em] md:text-xl">
						HANOICAM
					</span>
				</Link>

				<nav className="flex items-center gap-1" aria-label="Chính">
					<div className="hidden sm:flex sm:items-center sm:gap-0.5">
						{PUBLIC_NAV_LINKS.map(({ href, label }) => {
							const active = isActive(href);
							return (
								<Link
									key={href}
									href={href}
									className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
										active ? 'text-ink' : 'text-ink-secondary hover:text-ink'
									}`}
								>
									{label}
									{active ? (
										<span
											aria-hidden
											className="absolute inset-x-3 -bottom-0.5 h-[1.5px] bg-vermilion"
										/>
									) : null}
								</Link>
							);
						})}
					</div>

					<div className="ml-1">
						<ThemeToggle />
					</div>

					<div className="ml-1">
						{status === 'loading' ? (
							<div className="h-9 w-9 animate-pulse rounded-full bg-surface-hover" />
						) : session?.user ? (
							<div ref={userMenuRef} className="relative">
								<button
									type="button"
									onClick={() => setUserMenuOpen((v) => !v)}
									className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline transition duration-200 hover:ring-vermilion focus-visible:outline-none"
									aria-label="Menu người dùng"
									aria-expanded={userMenuOpen}
								>
									{session.user.image ? (
										<img
											src={session.user.image}
											alt=""
											className="h-full w-full object-cover"
											referrerPolicy="no-referrer"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-ink text-xs font-bold text-paper">
											{(session.user.name ?? 'U')[0].toUpperCase()}
										</div>
									)}
								</button>

								<AnimatePresence>
									{userMenuOpen ? (
										<m.div
											initial={reduce ? false : { opacity: 0, y: -6 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -4 }}
											transition={{ duration: duration.ui, ease: ease.transition }}
											className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[10px] border border-hairline bg-paper shadow-lg"
										>
											<div className="border-b border-hairline px-4 py-3">
												<p className="truncate text-sm font-semibold text-ink">{session.user.name}</p>
												<p className="truncate text-xs text-ink-secondary">{session.user.email}</p>
											</div>
											<div className="py-1">
												{USER_MENU_LINKS.map(({ href, label }) => (
													<Link
														key={href}
														href={href}
														onClick={() => setUserMenuOpen(false)}
														className="block px-4 py-2.5 text-sm text-ink-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-ink"
													>
														{label}
													</Link>
												))}
												{session.user.role === 'admin' && (
													<Link
														href={routes.admin.home}
														onClick={() => setUserMenuOpen(false)}
														className="block px-4 py-2.5 text-sm text-ink-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-ink"
													>
														Quản trị
													</Link>
												)}
											</div>
											<div className="border-t border-hairline py-1">
												<button
													type="button"
													onClick={() => {
														setUserMenuOpen(false);
														void signOut({ callbackUrl: routes.home });
													}}
													className="block w-full px-4 py-2.5 text-left text-sm text-vermilion transition-colors duration-200 hover:bg-surface-hover"
												>
													Đăng xuất
												</button>
											</div>
										</m.div>
									) : null}
								</AnimatePresence>
							</div>
						) : (
							<Link
								href={routes.login}
								className="hidden min-[400px]:inline-flex min-h-11 items-center rounded-[10px] bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper transition duration-200 hover:bg-ink/90 sm:inline-flex"
							>
								Đăng nhập
							</Link>
						)}
					</div>

					<button
						ref={menuButtonRef}
						type="button"
						className="ml-1 flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors duration-200 hover:bg-surface-hover sm:hidden"
						onClick={() => setMobileOpen((v) => !v)}
						aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
						aria-expanded={mobileOpen}
						aria-controls={menuId}
					>
						{mobileOpen ? (
							<svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
							</svg>
						)}
					</button>
				</nav>
			</div>

			{/* Mobile chapter curtain */}
			<AnimatePresence>
				{mobileOpen ? (
					<m.div
						id={menuId}
						ref={mobilePanelRef}
						role="dialog"
						aria-modal="true"
						aria-label="Menu điều hướng"
						initial={reduce ? false : { y: '-8%', opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: '-4%', opacity: 0 }}
						transition={{ duration: duration.ui, ease: ease.reveal }}
						className="fixed inset-0 z-40 bg-canvas sm:hidden"
						style={{ top: 'var(--header-height)' }}
					>
						<div className="shell flex h-full flex-col py-8">
							<p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-secondary">Mục lục</p>
							<nav className="mt-6 flex flex-col gap-1">
								{PUBLIC_NAV_LINKS.map(({ href, label }, i) => {
									const active = isActive(href);
									return (
										<Link
											key={href}
											href={href}
											onClick={closeMobile}
											className={`group flex items-baseline gap-4 border-b border-hairline py-5 ${
												active ? 'text-ink' : 'text-ink-secondary'
											}`}
										>
											<span className="font-mono text-xs text-vermilion">
												{String(i + 1).padStart(2, '0')}
											</span>
											<span className="font-display text-3xl font-medium tracking-tight">{label}</span>
											{active ? <span className="ml-auto h-px w-8 bg-vermilion" aria-hidden /> : null}
										</Link>
									);
								})}
								{session?.user ? (
									<>
										{USER_MENU_LINKS.map(({ href, label }) => (
											<Link
												key={href}
												href={href}
												onClick={closeMobile}
												className="border-b border-hairline py-4 text-sm font-semibold uppercase tracking-widest text-ink-secondary"
											>
												{label}
											</Link>
										))}
										<button
											type="button"
											onClick={() => {
												closeMobile();
												void signOut({ callbackUrl: routes.home });
											}}
											className="py-4 text-left text-sm font-semibold uppercase tracking-widest text-vermilion"
										>
											Đăng xuất
										</button>
									</>
								) : (
									<Link
										href={routes.login}
										onClick={closeMobile}
										className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-ink px-5 text-xs font-semibold uppercase tracking-wider text-paper"
									>
										Đăng nhập
									</Link>
								)}
							</nav>
						</div>
					</m.div>
				) : null}
			</AnimatePresence>
		</header>
	);
}
