'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { getDesktopNavLinks, getMobileNavLinks, getPublishedContactCta } from '@/config/navigation';
import { routes } from '@/config/routes';
import { SITE_NAME, siteProfile } from '@/config/site';
import ContactLink from '@/components/contact/ContactLink';

const INTERNAL_PREFIXES = [
	'/admin',
	'/m/',
	'/messages',
	'/vocabulary',
	'/tai-khoan',
	'/dang-nhap',
	'/hoc/',
];

export default function Navbar() {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const desktopLinks = getDesktopNavLinks();
	const mobileLinks = getMobileNavLinks();
	const contactCta = getPublishedContactCta();
	const hidden = INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const closeMobile = useCallback(() => {
		setMobileOpen(false);
		queueMicrotask(() => menuButtonRef.current?.focus());
	}, []);

	useEffect(() => {
		if (!mobileOpen) return;
		const panel = panelRef.current;
		panel?.querySelector<HTMLElement>('a, button')?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') closeMobile();
			if (event.key !== 'Tab' || !panel) return;
			const nodes = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
			if (!nodes.length) return;
			const first = nodes[0];
			const last = nodes[nodes.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
			if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [mobileOpen, closeMobile]);

	if (hidden) return null;

	function isActive(href: string) {
		return pathname === href || (href !== routes.home && pathname.startsWith(`${href}/`));
	}

	return (
		<header
			className={`fixed inset-x-0 top-0 z-50 border-b transition-[height,background-color,border-color] duration-300 ${scrolled ? 'h-16 lg:h-[4.5rem]' : 'h-[var(--header-height)]'} ${scrolled || mobileOpen ? 'border-hairline bg-canvas/95 backdrop-blur-md' : 'border-transparent bg-canvas/85 backdrop-blur-sm'}`}
		>
			<div className="shell flex h-full items-center justify-between">
				<Link
					href={routes.home}
					aria-label={`${SITE_NAME} — trang chủ`}
					className="font-display text-xl font-medium tracking-[-0.01em] text-ink sm:text-[1.375rem]"
				>
					{SITE_NAME}
				</Link>
				<div className="hidden items-center gap-7 lg:flex">
					<nav className="flex items-center gap-7" aria-label="Chính">
						{desktopLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								aria-current={isActive(link.href) ? 'page' : undefined}
								className={`relative py-3 text-xs font-medium tracking-[0.06em] transition-colors ${isActive(link.href) ? 'text-ink after:absolute after:inset-x-0 after:bottom-1 after:h-px after:bg-accent' : 'text-ink-secondary hover:text-accent'}`}
							>
								{link.label}
							</Link>
						))}
					</nav>
					{contactCta ? (
						<ContactLink
							href={contactCta.href}
							className="inline-flex min-h-11 items-center border border-ink bg-ink px-5 text-sm font-semibold tracking-[0.01em] text-canvas transition-colors hover:border-accent hover:bg-accent"
						>
							{contactCta.label}
						</ContactLink>
					) : null}
				</div>
				<button
					ref={menuButtonRef}
					type="button"
					onClick={() => setMobileOpen(true)}
					className="min-h-11 min-w-11 px-1 text-sm font-semibold tracking-[0.01em] text-ink lg:hidden"
					aria-label="Mở menu"
					aria-expanded={mobileOpen}
					aria-controls={menuId}
				>
					Menu
				</button>
			</div>

			{mobileOpen ? (
				<div
					id={menuId}
					ref={panelRef}
					role="dialog"
					aria-modal="true"
					aria-label="Menu điều hướng"
					className="fixed inset-0 z-50 flex min-h-svh flex-col bg-canvas px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:hidden"
				>
					<div className="flex h-[var(--header-height)] items-center justify-between border-b border-hairline">
						<Link
							href={routes.home}
							onClick={closeMobile}
							className="font-display text-xl text-ink"
						>
							{SITE_NAME}
						</Link>
						<button
							type="button"
							onClick={closeMobile}
							className="min-h-11 min-w-11 px-1 text-sm font-semibold tracking-[0.01em] text-ink"
						>
							Đóng
						</button>
					</div>
					<nav className="flex flex-1 flex-col justify-center" aria-label="Mobile">
						{[
							{ href: routes.home, label: 'Trang chủ' },
							...mobileLinks,
						].map((link, index) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={closeMobile}
								aria-current={isActive(link.href) ? 'page' : undefined}
								className={`group flex min-h-14 items-center justify-between border-b border-hairline py-4 type-h3 transition-colors ${isActive(link.href) ? 'text-accent' : 'hover:text-accent'}`}
							>
								<span>{link.label}</span>
								<span className="font-mono text-xs text-accent">0{index + 1}</span>
							</Link>
						))}
					</nav>
					<div className="border-t border-hairline pt-5">
						{contactCta ? (
							<ContactLink
								href={contactCta.href}
								onClick={closeMobile}
								className="editorial-button editorial-button-dark w-full"
							>
								{contactCta.label} <span aria-hidden>→</span>
							</ContactLink>
						) : null}
						{siteProfile.shortBio ? (
							<p className="mt-4 text-xs leading-relaxed text-ink-secondary">
								{siteProfile.shortBio}
							</p>
						) : null}
					</div>
				</div>
			) : null}
		</header>
	);
}
