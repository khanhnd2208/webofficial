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
	writeStoredAtmosphere,
	type BloomOrigin,
	type CoverAtmosphere,
} from './cover/coverAtmosphere';
import CoverEditorialCopy from './cover/CoverEditorialCopy';
import CoverLivingPlate from './cover/CoverLivingPlate';
import './cover/living-cover.css';
import './cover/folio.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type ViewTransitionDocument = Document & {
	startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Living book cover at `/`:
 * - SSR & no-JS render warm Dawn paper (zero hidden text).
 * - Pre-paint bootstrap script sets `html[data-cover-atmosphere]` at 0ms so evening
 *   visitors land straight into serene Night indigo with zero Dawn flash.
 * - Toggling Dawn <-> Night triggers a synchronized full-viewport feathered watercolor
 *   bloom radiating outward from the sun/moon or exact click coordinates.
 */
export default function IntroLanding() {
	const { reduced } = useMotionTier();
	const [atmosphere, setAtmosphere] = useState<CoverAtmosphere>('dawn');
	const [ready, setReady] = useState(false);
	const [opening, setOpening] = useState(false);
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
			const next: CoverAtmosphere = atmosphere === 'night' ? 'dawn' : 'night';
			writeStoredAtmosphere(next);

			const doc = document as ViewTransitionDocument;
			const canViewTransition = !reduced && typeof doc.startViewTransition === 'function';

			if (!canViewTransition) {
				setViewTransitionActive(false);
				document.documentElement.dataset.coverAtmosphere = next;
				setAtmosphere(next);
				return;
			}

			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const maxRadius =
				Math.max(
					Math.hypot(origin.clientX, origin.clientY),
					Math.hypot(vw - origin.clientX, origin.clientY),
					Math.hypot(origin.clientX, vh - origin.clientY),
					Math.hypot(vw - origin.clientX, vh - origin.clientY),
				) + 140;

			const root = document.documentElement;
			root.style.setProperty('--cover-bloom-x', `${origin.clientX}px`);
			root.style.setProperty('--cover-bloom-y', `${origin.clientY}px`);
			root.style.setProperty('--cover-bloom-max', `${Math.ceil(maxRadius)}px`);
			root.classList.add('cover-blooming');

			try {
				const transition = doc.startViewTransition!(() => {
					flushSync(() => {
						setViewTransitionActive(true);
						root.dataset.coverAtmosphere = next;
						setAtmosphere(next);
					});
				});
				transition.finished
					.catch(() => undefined)
					.finally(() => {
						root.classList.remove('cover-blooming');
						setViewTransitionActive(false);
					});
			} catch {
				root.classList.remove('cover-blooming');
				setViewTransitionActive(false);
				root.dataset.coverAtmosphere = next;
				setAtmosphere(next);
			}
		},
		[atmosphere, reduced],
	);

	const handleOpenToc = useCallback(() => {
		if (atmosphere === 'night') setOpening(true);
	}, [atmosphere]);

	return (
		<div
			className="personal-book book-cover cover-folio"
			data-testid="intro-home"
			data-atmosphere={atmosphere}
			data-atmosphere-ready={ready ? 'true' : undefined}
			data-opening={opening ? 'true' : undefined}
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
				<CoverEditorialCopy onOpenToc={handleOpenToc} onWhisperChange={setWhisperOpen} />
				<CoverLivingPlate
					atmosphere={atmosphere}
					viewTransitionActive={viewTransitionActive}
					onToggleAtmosphere={handleToggleAtmosphere}
				/>
			</main>
		</div>
	);
}
