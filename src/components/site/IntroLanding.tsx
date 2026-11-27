'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

import BrandWordmark from './BrandWordmark';
import SiteAuthChip from './SiteAuthChip';
import {
	readInitialClientAtmosphere,
	runAtmosphereViewTransition,
	writeStoredAtmosphere,
	type BloomOrigin,
	type CoverAtmosphere,
} from './cover/coverAtmosphere';
import CoverEditorialCopy from './cover/CoverEditorialCopy';
import CoverLivingPlate from './cover/CoverLivingPlate';
import './cover/living-cover.css';
import './cover/folio.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Living book cover at `/`:
 * - SSR & no-JS render warm Dawn paper (zero hidden text).
 * - Pre-paint bootstrap script sets `html[data-cover-atmosphere]` at 0ms so evening
 *   visitors land straight into serene Night indigo with zero Dawn flash.
 * - Toggling Dawn <-> Night triggers a synchronized, interruptible full-viewport bloom
 *   radiating outward from the sun/moon or exact click/drag coordinates.
 */
export default function IntroLanding() {
	const { reduced } = useMotionTier();
	const [atmosphere, setAtmosphere] = useState<CoverAtmosphere>('dawn');
	const [ready, setReady] = useState(false);
	const [whisperOpen, setWhisperOpen] = useState(false);
	const [viewTransitionActive, setViewTransitionActive] = useState(false);

	useIsoLayoutEffect(() => {
		const initial = readInitialClientAtmosphere();
		document.documentElement.dataset.coverAtmosphere = initial;
		setAtmosphere(initial);
		setReady(true);

		return () => {
			delete document.documentElement.dataset.coverAtmosphere;
			document.documentElement.classList.remove('cover-blooming');
		};
	}, []);

	const handleToggleAtmosphere = useCallback(
		(origin: BloomOrigin) => {
			const root = document.documentElement;
			const current = root.dataset.coverAtmosphere === 'night' ? 'night' : 'dawn';
			const next: CoverAtmosphere = current === 'night' ? 'dawn' : 'night';
			writeStoredAtmosphere(next);

			runAtmosphereViewTransition({
				clientX: origin.clientX,
				clientY: origin.clientY,
				reduced,
				commit: (usingViewTransition) => {
					const apply = () => {
						setViewTransitionActive(usingViewTransition);
						root.dataset.coverAtmosphere = next;
						setAtmosphere(next);
					};
					if (usingViewTransition) {
						flushSync(apply);
					} else {
						apply();
					}
				},
				onFinish: () => {
					setViewTransitionActive(false);
				},
			});
		},
		[reduced],
	);

	return (
		<div
			className="personal-book book-cover cover-folio"
			data-testid="intro-home"
			data-atmosphere={atmosphere}
			data-atmosphere-ready={ready ? 'true' : undefined}
			data-whisper-open={whisperOpen ? 'true' : undefined}
			data-js={ready ? 'true' : undefined}
		>
			<header className="cover-meta">
				<Link href={routes.home} className="cover-brand">
					<BrandWordmark />
				</Link>
				<span className="cover-colophon" aria-current="page">
					{introPage.location} · {introPage.year}
				</span>
				<SiteAuthChip variant="chrome" />
			</header>
			<div className="cover-book-board">
				<main className="cover-composition">
					<div className="cover-paper-grain" aria-hidden="true" />
					<div className="cover-sunlight-wash" aria-hidden="true" />
					<CoverEditorialCopy onWhisperChange={setWhisperOpen} />
					<CoverLivingPlate
						atmosphere={atmosphere}
						viewTransitionActive={viewTransitionActive}
						onToggleAtmosphere={handleToggleAtmosphere}
					/>
					<div className="cover-leaf-colophon" aria-hidden="true">
						<svg className="cover-chop-seal" viewBox="0 0 24 24" fill="none">
							<rect
								x="2.2"
								y="2.2"
								width="19.6"
								height="19.6"
								rx="3.5"
								stroke="currentColor"
								strokeWidth="1.25"
							/>
							<path
								d="M6.5 16.5 L10.2 10.2 L13 13.8 L15.4 11.2 L18 16.5"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<circle cx="15.8" cy="7.6" r="1.4" fill="currentColor" />
						</svg>
						<span className="cover-folio-page-num">tr. i</span>
					</div>
				</main>
			</div>
		</div>
	);
}
