'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { routes } from '@/config/routes';

import BrandWordmark from './BrandWordmark';
import SiteAuthChip from './SiteAuthChip';
import {
	parseAtmosphereParam,
	readStoredAtmosphere,
	resolveTimeAtmosphere,
	writeStoredAtmosphere,
	type CoverAtmosphere,
} from './cover/coverAtmosphere';
import CoverEditorialCopy from './cover/CoverEditorialCopy';
import CoverLivingPlate from './cover/CoverLivingPlate';
import './cover/living-cover.css';

/**
 * Living book cover at `/`:
 * - Server-renders in warm Dawn paper (matches Brand Brief & works cleanly without JS).
 * - On mount, respects `?mode=dawn|night`, session preference, or local time of day
 *   (06:00–17:59 Dawn paper; 18:00–05:59 Night indigo ink-wash).
 * - Visitors can always call Dawn or Night freely from the sun/moon, plate, or caption bar.
 */
export default function IntroLanding() {
	const [atmosphere, setAtmosphere] = useState<CoverAtmosphere>('dawn');
	const [opening, setOpening] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const forced = parseAtmosphereParam(params.get('mode'));
		const stored = readStoredAtmosphere();
		const target = forced ?? stored ?? resolveTimeAtmosphere();

		if (target === 'dawn') return;

		// Brief pause when auto-settling into evening dusk so the transition feels calm and deliberate
		const delay = forced || stored ? 0 : 280;
		const timer = window.setTimeout(() => {
			setAtmosphere('night');
		}, delay);
		return () => window.clearTimeout(timer);
	}, []);

	const handleToggleAtmosphere = useCallback(() => {
		setAtmosphere((current) => {
			const next: CoverAtmosphere = current === 'night' ? 'dawn' : 'night';
			writeStoredAtmosphere(next);
			return next;
		});
	}, []);

	const handleOpenToc = useCallback(() => {
		if (atmosphere === 'night') setOpening(true);
	}, [atmosphere]);

	return (
		<div
			className="personal-book book-cover"
			data-testid="intro-home"
			data-atmosphere={atmosphere}
			data-opening={opening ? 'true' : undefined}
		>
			<header className="cover-meta">
				<Link href={routes.home} className="cover-brand">
					<BrandWordmark />
				</Link>
				<span aria-current="page">Trang chủ</span>
				<SiteAuthChip variant="chrome" />
			</header>
			<main className="cover-composition">
				<CoverEditorialCopy onOpenToc={handleOpenToc} />
				<CoverLivingPlate atmosphere={atmosphere} onToggleAtmosphere={handleToggleAtmosphere} />
			</main>
		</div>
	);
}
