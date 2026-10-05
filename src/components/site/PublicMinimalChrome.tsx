'use client';

import BrandWordmark from './BrandWordmark';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import QuickContactPanel from '@/components/contact/QuickContactPanel';
import SiteAuthChip from '@/components/site/SiteAuthChip';
import {
	CONTACT_CTA,
	isIntroPath,
	isMinimalChromePath,
	isMySpaceHubPath,
	isMySpacePath,
	isMySpaceQuizPlayPath,
	isTocPath,
} from '@/config/navigation';
import { routes } from '@/config/routes';

/**
 * Minimal public chrome for the intro → mục lục IA:
 * - GateBack on inner marketing pages (returns to mục lục)
 * - Soft return to intro on the mục lục itself
 * - Nested My Space surfaces return to the My Space hub
 * - Quiz play owns its own back link (no fixed GateBack chip)
 * - "Gửi lời nhắn" rail / mobile FAB on destinations (not on intro)
 */
export default function PublicMinimalChrome() {
	const pathname = usePathname();
	const [panelOpen, setPanelOpen] = useState(false);

	// Teaching public boards own their own compact header and must not inherit
	// the marketing gate/contact chrome (especially the mobile floating CTA).
	if (pathname === '/lop' || pathname.startsWith('/lop/')) return null;
	if (!isMinimalChromePath(pathname) || isIntroPath(pathname)) return null;

	const isBookPage = [
		routes.toc,
		routes.about,
		routes.experiences,
		routes.projects,
		routes.services,
	].some((route) => route === pathname);
	const onToc = isTocPath(pathname);
	const onQuizPlay = isMySpaceQuizPlayPath(pathname);
	const onMySpaceNested = isMySpacePath(pathname) && !isMySpaceHubPath(pathname) && !onQuizPlay;
	const showContact =
		pathname !== routes.contact &&
		pathname !== routes.discoverCourses &&
		pathname !== routes.learnCourses &&
		!onToc;
	// Hide FAB where a fixed chip would collide with a full-bleed composition
	// (services hero illustration, My Space centered grid / quiz).
	const showMobileFab =
		showContact && !isBookPage && pathname !== routes.services && !isMySpacePath(pathname);
	const sourcePage = pathname || routes.home;
	const showBackChip = !onQuizPlay;
	const parentHref = onToc ? routes.home : onMySpaceNested ? routes.mySpace : routes.toc;
	const parentLabel = onToc ? 'Trang chủ' : onMySpaceNested ? 'Không gian' : 'Mục lục';
	const currentLabel = onToc
		? 'Mục lục'
		: pathname === routes.about
			? 'Giới thiệu'
			: pathname === routes.discoverCourses || pathname === routes.learnCourses
				? 'Khóa học'
				: pathname === routes.boardGame
					? 'Trò chơi'
					: pathname === routes.contact
						? 'Liên hệ'
						: onMySpaceNested
							? 'Khám phá'
							: pathname === routes.mySpace
								? 'Không gian'
								: pathname === routes.projects || pathname.startsWith(`${routes.projects}/`)
									? 'Dự án'
									: pathname === routes.experiences || pathname.startsWith(`${routes.experiences}/`)
										? 'Trải nghiệm'
										: pathname === routes.services
											? 'Dịch vụ'
											: pathname === routes.notes || pathname.startsWith(`${routes.notes}/`)
												? 'Ghi chép'
												: pathname.startsWith('/chinh-sach')
													? 'Chính sách'
													: 'Không tìm thấy';

	return (
		<>
			<header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-canvas/95 px-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md sm:px-8">
				<div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
					<Link
						href={routes.home}
						className="w-fit whitespace-nowrap font-display text-body font-semibold tracking-tight text-ink transition-opacity duration-150 hover:opacity-70"
					>
						<BrandWordmark />
					</Link>
					{showBackChip ? (
						<nav
							aria-label="Đường dẫn"
							className="flex min-w-0 items-center justify-center gap-1.5 text-label text-ink-secondary"
						>
							<Link
								href={parentHref}
								className="shrink-0 transition-colors duration-150 hover:text-ink"
								data-testid={onToc ? 'intro-back' : onMySpaceNested ? 'myspace-back' : 'gate-back'}
							>
								{parentLabel}
							</Link>
							<span aria-hidden="true" className="hidden opacity-50 sm:inline">
								/
							</span>
							<span
								aria-current="page"
								className="sr-only font-medium text-ink sm:not-sr-only sm:truncate"
							>
								{currentLabel}
							</span>
						</nav>
					) : (
						<span />
					)}
					<div className="flex justify-end whitespace-nowrap">
						<SiteAuthChip />
					</div>
				</div>
			</header>

			{showContact && currentLabel !== 'Không tìm thấy' ? (
				<>
					{/* Desktop — vertical rail */}
					<button
						type="button"
						className={`${isBookPage ? 'book-chrome' : ''} chrome-fade-in chrome-fade-in-delay fixed top-1/2 right-[max(0.65rem,env(safe-area-inset-right))] z-50 hidden -translate-y-1/2 px-1.5 py-3 text-caption tracking-[0.16em] text-ink/45 transition-colors duration-250 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink focus-visible:outline-none md:inline-flex [writing-mode:vertical-rl]`}
						aria-label={CONTACT_CTA.label}
						data-testid="contact-rail"
						onClick={() => setPanelOpen(true)}
					>
						{CONTACT_CTA.label}
					</button>

					{/* Mobile — compact bottom FAB; hero CTA covers services page. */}
					{showMobileFab ? (
						<button
							type="button"
							className="chrome-fade-in chrome-fade-in-delay fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex min-h-11 items-center rounded-full border border-hairline bg-canvas px-4 text-caption tracking-[0.06em] text-ink/70 shadow-none transition-colors duration-250 hover:border-ink/30 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:outline-none md:hidden"
							aria-label={CONTACT_CTA.label}
							data-testid="contact-fab"
							onClick={() => setPanelOpen(true)}
						>
							{CONTACT_CTA.shortLabel}
						</button>
					) : null}

					<QuickContactPanel
						open={panelOpen}
						onClose={() => setPanelOpen(false)}
						sourcePage={sourcePage}
					/>
				</>
			) : null}
		</>
	);
}
