'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import {
	getDesktopNavLinks,
	getMobileNavLinks,
	getPublishedContactCta,
	USER_MENU_LINKS,
} from '@/config/navigation';
import { routes } from '@/config/routes';
import { SITE_NAME } from '@/config/site';
import { duration, ease } from '@/components/motion/tokens';

export default function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);
	const mobilePanelRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const reduce = useReducedMotion();
	const isAdmin = pathname.startsWith('/admin');
	const isPublicMessage = pathname.startsWith('/m/');
	const isLessonFocus = pathname.includes('/bai/');
	const isHome = pathname === routes.home;

	const desktopLinks = getDesktopNavLinks();
	const mobileLinks = getMobileNavLinks();
	const contactCta = getPublishedContactCta();

	useEffect(() => {
		function onScroll() {
			setScrolled(window.scrollY > 12);
		}
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
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
		queueMicrotask(() => menuButtonRef.current?.focus());
	}, []);

	useEffect(() => {
		if (!mobileOpen) return;

		const panel = mobilePanelRef.current;
		const focusable = panel?.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);
		focusable?.[0]?.focus();

		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				closeMobile();
				return;
			}
			if (e.key !== 'Tab' || !panel) return;
			const nodes = panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);
			if (nodes.length === 0) return;
			const first = nodes[0];
			const last = nodes[nodes.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}

		function onResize() {
			if (window.matchMedia('(min-width: 1024px)').matches) {
				setMobileOpen(false);
			}
		}

		document.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		const prevOverflow = document.body.style.overflow;
		const prevTouch = document.body.style.touchAction;
		document.body.style.overflow = 'hidden';
		document.body.style.touchAction = 'none';
		return () => {
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
			document.body.style.overflow = prevOverflow;
			document.body.style.touchAction = prevTouch;
		};
	}, [mobileOpen, closeMobile]);

	function isActive(href: string) {
		if (href.includes('#')) return false;
		if (href === routes.home) return pathname === routes.home;
		const pathOnly = href.split('#')[0] || href;
		return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
	}

	if (isAdmin || isPublicMessage) return null;

	const transparent = isHome && !scrolled && !mobileOpen && !isLessonFocus;

	return (
		<header
			className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[220ms] ${
				transparent
					? 'border-b border-transparent bg-transparent'
					: isLessonFocus
						? 'border-b border-transparent bg-paper/94 backdrop-blur-md'
						: 'border-b border-hairline bg-paper/94 backdrop-blur-md'
			}`}
			style={{ height: 'var(--header-height)' }}
		>
			<div className="shell flex h-full items-center justify-between gap-3">
				<Link
					href={routes.home}
					aria-label={`${SITE_NAME} — trang chủ`}
					aria-current={isHome ? 'page' : undefined}
					className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-[4px] px-1"
				>
					<span className="font-display text-base font-semibold tracking-[0.06em] text-ink sm:text-lg sm:tracking-[0.08em]">
						{SITE_NAME}
					</span>
				</Link>

				<nav className="flex min-w-0 items-center gap-1" aria-label="Chính">
					<div className="hidden lg:flex lg:items-center lg:gap-0.5">
						{desktopLinks.map(({ href, label }) => {
							const active = isActive(href);
							return (
								<Link
									key={href}
									href={href}
									aria-current={active ? 'page' : undefined}
									className={`relative inline-flex min-h-11 items-center rounded-[4px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-[200ms] ${
										active ? 'text-ink' : 'text-ink-secondary hover:text-ink'
									}`}
								>
									{label}
									{active ? (
										<span
											aria-hidden
											className="absolute inset-x-3 -bottom-0.5 h-[1.5px] bg-accent"
										/>
									) : null}
								</Link>
							);
						})}
					</div>

					{contactCta ? (
						<Link
							href={contactCta.href}
							aria-current={pathname === routes.contact ? 'page' : undefined}
							className="ml-1 hidden min-h-11 items-center rounded-[4px] bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper transition duration-[200ms] hover:bg-accent sm:inline-flex"
						>
							<span className="lg:hidden">{contactCta.shortLabel}</span>
							<span className="hidden lg:inline">{contactCta.label}</span>
						</Link>
					) : null}

					<div className="ml-1">
						{status === 'loading' ? (
							<div className="h-9 w-9 animate-pulse rounded-full bg-surface-hover" />
						) : session?.user ? (
							<div ref={userMenuRef} className="relative">
								<button
									type="button"
									onClick={() => setUserMenuOpen((v) => !v)}
									className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline transition duration-[200ms] hover:ring-accent focus-visible:outline-none"
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
											className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[4px] border border-hairline bg-paper shadow-lg"
										>
											<div className="border-b border-hairline px-4 py-3">
												<p className="truncate text-sm font-semibold text-ink">
													{session.user.name}
												</p>
												<p className="truncate text-xs text-ink-secondary">{session.user.email}</p>
											</div>
											<div className="py-1">
												{USER_MENU_LINKS.map(({ href, label }) => (
													<Link
														key={href}
														href={href}
														onClick={() => setUserMenuOpen(false)}
														className="block px-4 py-2.5 text-sm text-ink-secondary transition-colors duration-[200ms] hover:bg-surface-hover hover:text-ink"
													>
														{label}
													</Link>
												))}
												{session.user.role === 'admin' && (
													<Link
														href={routes.admin.home}
														onClick={() => setUserMenuOpen(false)}
														className="block px-4 py-2.5 text-sm text-ink-secondary transition-colors duration-[200ms] hover:bg-surface-hover hover:text-ink"
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
													className="block w-full px-4 py-2.5 text-left text-sm text-accent transition-colors duration-[200ms] hover:bg-surface-hover"
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
								className="hidden min-h-11 items-center rounded-[4px] px-2 py-2 text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink min-[400px]:inline-flex"
							>
								Đăng nhập
							</Link>
						)}
					</div>

					<button
						ref={menuButtonRef}
						type="button"
						className="ml-1 flex h-10 w-10 items-center justify-center rounded-[4px] transition-colors duration-[200ms] hover:bg-surface-hover lg:hidden"
						onClick={() => setMobileOpen((v) => !v)}
						aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
						aria-expanded={mobileOpen}
						aria-controls={menuId}
					>
						{mobileOpen ? (
							<svg
								className="h-5 w-5 text-ink"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<svg
								className="h-5 w-5 text-ink"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						)}
					</button>
				</nav>
			</div>

			<AnimatePresence>
				{mobileOpen ? (
					<>
						<m.button
							type="button"
							aria-label="Đóng menu"
							initial={reduce ? false : { opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: duration.ui }}
							className="fixed inset-x-0 bottom-0 z-40 bg-ink/30 lg:hidden"
							style={{ top: 'var(--header-height)' }}
							onClick={closeMobile}
						/>
						<m.div
							id={menuId}
							ref={mobilePanelRef}
							role="dialog"
							aria-modal="true"
							aria-label="Menu điều hướng"
							initial={reduce ? false : { opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: duration.ui, ease: ease.reveal }}
							className="fixed inset-x-0 z-40 flex flex-col bg-paper lg:hidden"
							style={{
								top: 'var(--header-height)',
								height: 'calc(100dvh - var(--header-height))',
								paddingBottom: 'env(safe-area-inset-bottom)',
							}}
						>
							<div className="shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-5">
								<p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-secondary">
									Menu
								</p>
								<nav className="mt-4 flex flex-col">
									{mobileLinks.map(({ href, label }) => {
										const active = isActive(href);
										return (
											<Link
												key={href}
												href={href}
												onClick={closeMobile}
												aria-current={active ? 'page' : undefined}
												className={`flex min-h-14 items-center justify-between border-b border-hairline py-3.5 ${
													active ? 'text-ink' : 'text-ink-secondary'
												}`}
											>
												<span className="font-display text-2xl font-medium tracking-tight">
													{label}
												</span>
												{active ? <span className="h-px w-6 bg-accent" aria-hidden /> : null}
											</Link>
										);
									})}
								</nav>

								{contactCta ? (
									<Link
										href={contactCta.href}
										onClick={closeMobile}
										aria-current={pathname === routes.contact ? 'page' : undefined}
										className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[4px] bg-ink px-5 text-xs font-semibold uppercase tracking-wider text-paper"
									>
										{contactCta.label}
									</Link>
								) : null}

								{!session?.user ? (
									<Link
										href={routes.login}
										onClick={closeMobile}
										className="mt-3 inline-flex min-h-12 items-center justify-center rounded-[4px] border border-hairline px-5 text-xs font-semibold uppercase tracking-wider text-ink-secondary transition-colors hover:border-ink hover:text-ink"
									>
										Đăng nhập
									</Link>
								) : null}
							</div>
						</m.div>
					</>
				) : null}
			</AnimatePresence>
		</header>
	);
}
