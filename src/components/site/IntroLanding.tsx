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
			<main className="cover-composition">
				<CoverEditorialCopy onWhisperChange={setWhisperOpen} />
				<CoverLivingPlate
					atmosphere={atmosphere}
					viewTransitionActive={viewTransitionActive}
					onToggleAtmosphere={handleToggleAtmosphere}
				/>
			</main>
		</div>
	);
}
