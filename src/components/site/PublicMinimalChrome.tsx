'use client';

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

	const onToc = isTocPath(pathname);
	const onQuizPlay = isMySpaceQuizPlayPath(pathname);
	const onMySpaceNested =
		isMySpacePath(pathname) && !isMySpaceHubPath(pathname) && !onQuizPlay;
	const showContact = pathname !== routes.contact;
	// Hide FAB where a fixed chip would collide with a full-bleed composition
	// (services hero illustration, My Space centered grid / quiz).
	const showMobileFab =
		showContact && pathname !== routes.services && !isMySpacePath(pathname);
	const sourcePage = pathname || routes.home;
	const showBackChip = !onQuizPlay;

	return (
		<>
			{showBackChip ? (
				onToc ? (
					<Link
						href={routes.home}
						className="chrome-fade-in fixed top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-50 inline-flex min-h-10 min-w-10 items-center text-[0.6875rem] tracking-[0.16em] text-ink/55 transition-colors duration-300 hover:text-ink focus-visible:text-ink focus-visible:outline-none"
						aria-label="Về trang mở đầu"
						data-testid="intro-back"
					>
						← Trở thành
					</Link>
				) : onMySpaceNested ? (
					<Link
						href={routes.mySpace}
						className="chrome-fade-in fixed top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-50 inline-flex min-h-10 min-w-10 items-center text-[0.6875rem] tracking-[0.16em] text-ink/55 transition-colors duration-300 hover:text-ink focus-visible:text-ink focus-visible:outline-none"
						aria-label="Về My Space"
						data-testid="myspace-back"
					>
						← My Space
					</Link>
				) : (
					<Link
						href={routes.toc}
						className="chrome-fade-in fixed top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-50 inline-flex min-h-10 min-w-10 items-center text-[0.6875rem] tracking-[0.16em] text-ink/55 transition-colors duration-300 hover:text-ink focus-visible:text-ink focus-visible:outline-none"
						aria-label="Về mục lục"
						data-testid="gate-back"
					>
						← Mục lục
					</Link>
				)
			) : null}

			<div className="chrome-fade-in fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50">
				<SiteAuthChip />
			</div>

			{showContact ? (
				<>
					{/* Desktop — vertical rail */}
					<button
						type="button"
						className="chrome-fade-in chrome-fade-in-delay fixed top-1/2 right-[max(0.65rem,env(safe-area-inset-right))] z-50 hidden -translate-y-1/2 px-1.5 py-3 text-[0.6875rem] tracking-[0.22em] text-ink/45 transition-colors duration-300 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink focus-visible:outline-none md:inline-flex [writing-mode:vertical-rl]"
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
							className="chrome-fade-in chrome-fade-in-delay fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex min-h-11 items-center rounded-full border border-hairline bg-canvas px-4 text-[0.75rem] tracking-[0.06em] text-ink/70 shadow-none transition-colors duration-300 hover:border-ink/30 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:outline-none md:hidden"
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
