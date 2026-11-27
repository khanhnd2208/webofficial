'use client';

import { getImageProps } from 'next/image';
import Link from 'next/link';
import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

import CoverPageCorner from './CoverPageCorner';
import { useCoverPointer } from './useCoverPointer';
import CoverAtmosphereCanvas, { type TransitionPulse } from './CoverAtmosphereCanvas';
import {
	DESKTOP_CONSTELLATION,
	DESKTOP_JOURNEY_PATH,
	DESKTOP_STARS,
	DESKTOP_SUN_POS,
	MOBILE_CONSTELLATION,
	MOBILE_JOURNEY_PATH,
	MOBILE_STARS,
	MOBILE_SUN_POS,
	type BloomOrigin,
	type CoverAtmosphere,
} from './coverAtmosphere';

interface CoverLivingPlateProps {
	atmosphere: CoverAtmosphere;
	/** True when full-viewport View Transition handled the latest toggle (avoid double mask). */
	viewTransitionActive: boolean;
	onToggleAtmosphere: (origin: BloomOrigin) => void;
}

const FALLBACK_REVEAL_MS = 1320;

function formatPolyline(points: readonly { x: number; y: number }[]): string {
	return points.map((p) => `${p.x},${p.y}`).join(' ');
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Living archival bookplate:
 * - Seamless cotton-paper integration (letterpress plate-mark border, multiply ink blend in Dawn,
 *   pixel-aligned Prussian-indigo ink-wash plate in Night with zero X-ray inversion).
 * - Full-viewport synchronized bloom origin tracking (sun/moon center or exact pointer click),
 *   with organic SVG rag-paper watercolor mask fallback for browsers without View Transitions.
 * - Tactile living canvas in BOTH Dawn (wind-reactive leaves, sunlit motes, road warmth, sun corona)
 *   and Night (candlelit amber lantern, magnetic constellation, lunar corona, stardust).
 * - Crisp editorial asterisk (`✦`) marginalia markers that float in open margin on desktop and
 *   dock cleanly into the caption bar beneath the artwork on mobile (never obscuring the traveler).
 */
export default function CoverLivingPlate({
	atmosphere,
	viewTransitionActive,
	onToggleAtmosphere,
}: CoverLivingPlateProps) {
	const { allowsAmbient, reduced } = useMotionTier();
	const uid = useId().replace(/:/g, '');
	const maskId = `cover-reveal-mask-${uid}`;
	const bleedFilterId = `cover-bleed-filter-${uid}`;

	const frameRef = useRef<HTMLDivElement>(null);
	const celestialRef = useRef<HTMLButtonElement>(null);
	const personNoteRef = useRef<HTMLDetailsElement>(null);
	const journeyNoteRef = useRef<HTMLDetailsElement>(null);
	const revealCircleRef = useRef<SVGCircleElement>(null);
	const tweenRafRef = useRef<number | null>(null);
	const prevAtmosphereRef = useRef<CoverAtmosphere>(atmosphere);
	const pendingOriginRef = useRef<BloomOrigin | null>(null);
	const { pointerRef } = useCoverPointer(frameRef, allowsAmbient);
	const pulseCounterRef = useRef(0);
	const mountedRef = useRef(false);

	const [isDesktop, setIsDesktop] = useState(true);
	const [fallbackBox, setFallbackBox] = useState<{ w: number; h: number }>({ w: 720, h: 600 });
	const [isFallbackTransitioning, setIsFallbackTransitioning] = useState(false);
	const [pathWarmed, setPathWarmed] = useState(false);
	const [hasInteracted, setHasInteracted] = useState(false);
	const [pulse, setPulse] = useState<TransitionPulse | null>(null);
	const [openNote, setOpenNote] = useState<'person' | 'journey' | null>(null);

	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1024px)');
		const sync = () => setIsDesktop(mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	}, []);

	const closeAllNotes = useCallback(() => {
		if (personNoteRef.current) personNoteRef.current.open = false;
		if (journeyNoteRef.current) journeyNoteRef.current.open = false;
		setOpenNote(null);
	}, []);

	// Close marginalia on Escape or outside pointer click
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			const activeEl = [personNoteRef.current, journeyNoteRef.current].find((note) => note?.open);
			if (!activeEl) return;
			closeAllNotes();
			activeEl?.querySelector('summary')?.focus();
		};
		const onPointerDown = (event: PointerEvent) => {
			if (!personNoteRef.current?.open && !journeyNoteRef.current?.open) return;
			const target = event.target as Node;
			if (
				personNoteRef.current?.contains(target) ||
				journeyNoteRef.current?.contains(target) ||
				(target instanceof Element && target.closest('.cover-docked-note'))
			) {
				return;
			}
			closeAllNotes();
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	}, [closeAllNotes]);

	// Synchronize initial mounted atmosphere & run organic SVG fallback reveal only if needed
	useIsoLayoutEffect(() => {
		if (!mountedRef.current) {
			mountedRef.current = true;
			prevAtmosphereRef.current = atmosphere;
			return;
		}
		const prev = prevAtmosphereRef.current;
		if (prev === atmosphere) return;
		prevAtmosphereRef.current = atmosphere;

		setPathWarmed(atmosphere === 'dawn');

		// When the user's initial pre-paint bootstrap synced state, or View Transitions is animating,
		// skip the redundant plate-only mask wipe so the whole screen blooms cleanly once.
		if (reduced || viewTransitionActive || !pendingOriginRef.current) {
			if (revealCircleRef.current) revealCircleRef.current.setAttribute('r', '0');
			setIsFallbackTransitioning(false);
			setPulse(null);
			pendingOriginRef.current = null;
			return;
		}

		if (tweenRafRef.current) cancelAnimationFrame(tweenRafRef.current);

		const origin = pendingOriginRef.current;
		pendingOriginRef.current = null;

		const frameRect = frameRef.current?.getBoundingClientRect();
		const w = frameRect?.width ? Math.round(frameRect.width) : 720;
		const h = frameRect?.height ? Math.round(frameRect.height) : 600;
		setFallbackBox({ w, h });
		const ox = origin.plateX * w;
		const oy = origin.plateY * h;
		const maxR =
			Math.max(
				Math.hypot(ox, oy),
				Math.hypot(w - ox, oy),
				Math.hypot(ox, h - oy),
				Math.hypot(w - ox, h - oy),
			) + 52;
		const startTime = performance.now();

		const initialCircle = revealCircleRef.current;
		if (initialCircle) {
			initialCircle.setAttribute('cx', ox.toFixed(1));
			initialCircle.setAttribute('cy', oy.toFixed(1));
			initialCircle.setAttribute('r', atmosphere === 'dawn' ? '0' : maxR.toFixed(1));
		}

		setIsFallbackTransitioning(true);
		pulseCounterRef.current += 1;
		setPulse({
			id: pulseCounterRef.current,
			from: prev,
			to: atmosphere,
			originX: origin.plateX,
			originY: origin.plateY,
			startTime,
			durationMs: FALLBACK_REVEAL_MS,
		});

		const step = (now: number) => {
			const rawT = (now - startTime) / FALLBACK_REVEAL_MS;
			const t = Math.min(Math.max(rawT, 0), 1);
			const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
			const radius = atmosphere === 'dawn' ? eased * maxR : (1 - eased) * maxR;

			const circle = revealCircleRef.current;
			if (circle) {
				circle.setAttribute('cx', ox.toFixed(1));
				circle.setAttribute('cy', oy.toFixed(1));
				circle.setAttribute('r', Math.max(0, radius).toFixed(1));
			}

			if (t < 1) {
				tweenRafRef.current = requestAnimationFrame(step);
			} else {
				tweenRafRef.current = null;
				if (atmosphere === 'night' && circle) {
					circle.setAttribute('r', '0');
				}
				setIsFallbackTransitioning(false);
				setPulse(null);
			}
		};

		tweenRafRef.current = requestAnimationFrame(step);
		return () => {
			if (tweenRafRef.current) cancelAnimationFrame(tweenRafRef.current);
		};
	}, [atmosphere, reduced, viewTransitionActive]);

	const computeSunOrigin = useCallback((): BloomOrigin => {
		const desktopNow =
			typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : isDesktop;
		const sunPos = desktopNow ? DESKTOP_SUN_POS : MOBILE_SUN_POS;
		const btnRect = celestialRef.current?.getBoundingClientRect();
		if (btnRect && btnRect.width > 0) {
			return {
				clientX: Math.round(btnRect.left + btnRect.width / 2),
				clientY: Math.round(btnRect.top + btnRect.height / 2),
				plateX: sunPos.x / 100,
				plateY: sunPos.y / 100,
			};
		}
		const frameRect = frameRef.current?.getBoundingClientRect();
		if (frameRect && frameRect.width > 0) {
			return {
				clientX: Math.round(frameRect.left + (sunPos.x / 100) * frameRect.width),
				clientY: Math.round(frameRect.top + (sunPos.y / 100) * frameRect.height),
				plateX: sunPos.x / 100,
				plateY: sunPos.y / 100,
			};
		}
		return {
			clientX: 720,
			clientY: 320,
			plateX: sunPos.x / 100,
			plateY: sunPos.y / 100,
		};
	}, [isDesktop]);

	const triggerFromSun = useCallback(() => {
		setHasInteracted(true);
		const origin = computeSunOrigin();
		pendingOriginRef.current = origin;
		onToggleAtmosphere(origin);
	}, [computeSunOrigin, onToggleAtmosphere]);

	function turnFromPoint(clientX: number, clientY: number) {
		const rect = frameRef.current?.getBoundingClientRect();
		if (!rect?.width || !rect.height) return triggerFromSun();
		const origin = {
			clientX,
			clientY,
			plateX: Math.min(Math.max((clientX - rect.left) / rect.width, 0.05), 0.95),
			plateY: Math.min(Math.max((clientY - rect.top) / rect.height, 0.05), 0.95),
		};
		setHasInteracted(true);
		pendingOriginRef.current = origin;
		onToggleAtmosphere(origin);
	}

	const handleNoteToggle = (which: 'person' | 'journey', nextOpen: boolean) => {
		setHasInteracted(true);
		if (nextOpen) {
			const other = which === 'person' ? journeyNoteRef.current : personNoteRef.current;
			if (other) other.open = false;
			setOpenNote(which);
		} else if (openNote === which) {
			setOpenNote(null);
		}
	};

	const { props: dawnDesktop } = getImageProps({
		src: introPage.desktopImage.src,
		alt: introPage.desktopImage.alt,
		fill: true,
		sizes: '(min-width: 1360px) 540px, 41vw',
		loading: 'eager',
	});
	const { props: dawnMobile } = getImageProps({
		src: introPage.mobileImage.src,
		alt: introPage.mobileImage.alt,
		fill: true,
		sizes: '340px',
		loading: 'eager',
	});
	const { props: nightDesktop } = getImageProps({
		src: introPage.desktopNightImage.src,
		alt: '',
		fill: true,
		sizes: '(min-width: 1360px) 540px, 41vw',
		loading: 'eager',
	});
	const { props: nightMobile } = getImageProps({
		src: introPage.mobileNightImage.src,
		alt: '',
		fill: true,
		sizes: '340px',
		loading: 'eager',
	});

	const stars = isDesktop ? DESKTOP_STARS : MOBILE_STARS;
	const constellation = useMemo(
		() => formatPolyline(isDesktop ? DESKTOP_CONSTELLATION : MOBILE_CONSTELLATION),
		[isDesktop],
	);
	const journeyPath = isDesktop ? DESKTOP_JOURNEY_PATH : MOBILE_JOURNEY_PATH;
	const sunPos = isDesktop ? DESKTOP_SUN_POS : MOBILE_SUN_POS;

	const showNightLayer = atmosphere === 'night' || isFallbackTransitioning;

	const stageVars = {
		'--sun-x': `${sunPos.x}%`,
		'--sun-y': `${sunPos.y}%`,
	} as CSSProperties;

	const toggleLabel = atmosphere === 'night' ? 'Đón nắng sớm' : 'Đón đêm sao';
	const toggleAriaLabel = atmosphere === 'night' ? 'Chạm để đón nắng sớm' : 'Chạm để đón đêm sao';
	const plateStatus = atmosphere === 'night' ? 'Đêm khuya · Hà Nội' : 'Nắng sớm · Hà Nội';

	const dockedNote =
		!isDesktop && openNote
			? openNote === 'person'
				? {
						text: introPage.marginalia.person.note,
						href: routes.contact,
						linkLabel: introPage.marginalia.person.linkLabel,
					}
				: {
						text: introPage.marginalia.journey.note,
						href: routes.learnCourses,
						linkLabel: introPage.marginalia.journey.linkLabel,
					}
			: null;

	return (
		<figure className="cover-plate-figure" style={stageVars}>
			<div
				ref={frameRef}
				className="cover-plate-frame"
				data-atmosphere={atmosphere}
				data-transitioning={isFallbackTransitioning ? 'true' : undefined}
			>
				{/* Mount SVG rag-paper bleed filter ONLY during non-View-Transitions fallback */}
				{isFallbackTransitioning ? (
					<svg
						className="cover-mask-defs"
						width={fallbackBox.w}
						height={fallbackBox.h}
						viewBox={`0 0 ${fallbackBox.w} ${fallbackBox.h}`}
						aria-hidden="true"
					>
						<defs>
							<filter id={bleedFilterId} x="-18%" y="-18%" width="136%" height="136%">
								<feTurbulence
									type="fractalNoise"
									baseFrequency="0.019"
									numOctaves="2"
									seed="7"
									result="paperNoise"
								/>
								<feDisplacementMap
									in="SourceGraphic"
									in2="paperNoise"
									scale="28"
									xChannelSelector="R"
									yChannelSelector="G"
									result="displaced"
								/>
								<feGaussianBlur in="displaced" stdDeviation="4" />
							</filter>
							<mask
								id={maskId}
								maskUnits="userSpaceOnUse"
								x="0"
								y="0"
								width={fallbackBox.w}
								height={fallbackBox.h}
							>
								<rect width={fallbackBox.w} height={fallbackBox.h} fill="white" />
								<circle
									ref={revealCircleRef}
									cx={0}
									cy={0}
									r={0}
									fill="black"
									filter={`url(#${bleedFilterId})`}
								/>
							</mask>
						</defs>
					</svg>
				) : null}

				{/* Layer 1: Warm Dawn archival ink-wash plate + quiet living dawn overlays */}
				<div className="cover-layer-dawn">
					<div className="cover-parallax-mid">
						<picture>
							<source
								media="(min-width: 1024px)"
								srcSet={dawnDesktop.srcSet}
								sizes={dawnDesktop.sizes}
							/>
							<img
								{...dawnMobile}
								alt={introPage.desktopImage.alt}
								className="cover-plate-img cover-plate-img-dawn intro-image-treatment"
							/>
						</picture>
					</div>

					{/* Far sky layer (0.35x parallax): gentle sun aura & distant gliding ink birds */}
					<svg
						className="cover-dawn-sky cover-parallax-far"
						viewBox="0 0 1000 1000"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<circle
							className="cover-sun-aura"
							cx={sunPos.x * 10}
							cy={sunPos.y * 10}
							r={isDesktop ? 128 : 118}
						/>
						<g className="cover-bird-flock">
							<path
								className="cover-ink-bird cover-ink-bird-a"
								d="M 596 268 Q 604 261 610 267 Q 616 261 624 268"
							/>
							<path
								className="cover-ink-bird cover-ink-bird-b"
								d="M 636 296 Q 642 291 647 295 Q 652 291 658 296"
							/>
						</g>
					</svg>

					{/* Midground winding journey path ink trace */}
					<svg
						className={`cover-journey-overlay cover-parallax-mid ${pathWarmed ? 'is-warmed' : ''}`}
						viewBox="0 0 1000 1000"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path className="cover-journey-stroke" d={journeyPath} />
					</svg>
				</div>

				{/* Layer 2: Nocturnal Prussian-indigo ink-wash plate */}
				<div
					className="cover-layer-night"
					data-visible={showNightLayer ? 'true' : undefined}
					style={{
						mask: isFallbackTransitioning ? `url(#${maskId})` : undefined,
						WebkitMask: isFallbackTransitioning ? `url(#${maskId})` : undefined,
					}}
					aria-hidden="true"
				>
					<div className="cover-parallax-mid">
						<picture>
							<source
								media="(min-width: 1024px)"
								srcSet={nightDesktop.srcSet}
								sizes={nightDesktop.sizes}
							/>
							<img {...nightMobile} alt="" className="cover-plate-img" />
						</picture>
					</div>

					{/* Far sky layer (0.35x parallax): celestial arc, twinkling stars, constellation */}
					<svg
						className="cover-night-sky cover-parallax-far"
						viewBox="0 0 1000 1000"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path
							className="cover-celestial-arc"
							d={
								isDesktop ? 'M 40 310 A 560 460 0 0 1 970 250' : 'M 40 240 A 520 380 0 0 1 960 190'
							}
						/>
						<polyline className="cover-constellation-line" points={constellation} />
						{stars.map((star) => (
							<circle
								key={`${star.x}-${star.y}`}
								className={star.constellation ? 'cover-star cover-star-key' : 'cover-star'}
								cx={star.x}
								cy={star.y}
								r={star.r}
								style={{
									opacity: star.opacity,
									animationDelay: `${star.delaySec}s`,
								}}
							/>
						))}
					</svg>
				</div>

				{/* Subtle rag-paper texture + living tactile physics canvas */}
				<div className="intro-noise-overlay" aria-hidden="true" />
				<CoverAtmosphereCanvas
					atmosphere={atmosphere}
					isDesktop={isDesktop}
					allowsAmbient={allowsAmbient}
					reduced={reduced}
					pointerRef={pointerRef}
					pulse={pulse}
					hasInteracted={hasInteracted}
				/>

				{/* Full-plate click surface */}
				<button
					type="button"
					className="cover-plate-surface-btn"
					onClick={(event) =>
						event.detail > 0 ? turnFromPoint(event.clientX, event.clientY) : triggerFromSun()
					}
					aria-label={toggleAriaLabel}
					aria-pressed={atmosphere === 'night'}
					data-testid="cover-plate-toggle"
				>
					{!reduced && <CoverPageCorner frameRef={frameRef} onTurn={turnFromPoint} />}
				</button>

				{/* Natural focal point: sun/moon disc trigger */}
				<button
					ref={celestialRef}
					type="button"
					className="cover-celestial-trigger"
					onClick={triggerFromSun}
					aria-label={
						atmosphere === 'night'
							? 'Chạm vào mặt trăng để đón nắng sớm'
							: 'Chạm vào mặt trời để đón đêm sao'
					}
					title={toggleLabel}
				>
					<span className="cover-celestial-halo" aria-hidden="true" />
				</button>

				{/* Editorial marginalia 1: Explorer / Guiding star -> Về tôi */}
				<details
					ref={personNoteRef}
					className="cover-marginalia cover-marginalia-person"
					onToggle={(event) => handleNoteToggle('person', event.currentTarget.open)}
				>
					<summary
						className="cover-marginalia-dot"
						aria-label={introPage.marginalia.person.triggerLabel}
						title={introPage.marginalia.person.triggerLabel}
					>
						<span className="cover-marginalia-seal" aria-hidden="true">
							✦
						</span>
					</summary>
					<div className="cover-marginalia-slip" role="note">
						<p>{introPage.marginalia.person.note}</p>
						<Link href={routes.contact} className="cover-marginalia-link">
							{introPage.marginalia.person.linkLabel}
							<span aria-hidden="true">→</span>
						</Link>
					</div>
				</details>

				{/* Editorial marginalia 2: Winding mountain path -> Học tập */}
				<details
					ref={journeyNoteRef}
					className="cover-marginalia cover-marginalia-journey"
					onToggle={(event) => handleNoteToggle('journey', event.currentTarget.open)}
				>
					<summary
						className="cover-marginalia-dot"
						aria-label={introPage.marginalia.journey.triggerLabel}
						title={introPage.marginalia.journey.triggerLabel}
					>
						<span className="cover-marginalia-seal" aria-hidden="true">
							✦
						</span>
					</summary>
					<div className="cover-marginalia-slip" role="note">
						<p>{introPage.marginalia.journey.note}</p>
						<Link href={routes.learnCourses} className="cover-marginalia-link">
							{introPage.marginalia.journey.linkLabel}
							<span aria-hidden="true">→</span>
						</Link>
					</div>
				</details>
			</div>

			{/* Archival bookplate caption bar below the artwork (doubles as docked mobile footnote slot) */}
			<figcaption className="cover-plate-bar">
				{dockedNote ? (
					<div className="cover-docked-note" role="note" data-testid="cover-docked-note">
						<span className="cover-docked-text">{dockedNote.text}</span>
						<div className="cover-docked-actions">
							<Link href={dockedNote.href} className="cover-marginalia-link">
								{dockedNote.linkLabel}
								<span aria-hidden="true">→</span>
							</Link>
							<button
								type="button"
								className="cover-docked-close"
								onClick={closeAllNotes}
								aria-label="Đóng ghi chú"
							>
								×
							</button>
						</div>
					</div>
				) : (
					<>
						<span className="cover-plate-status">{plateStatus}</span>
						<button
							type="button"
							className="cover-atmosphere-toggle"
							onClick={triggerFromSun}
							aria-pressed={atmosphere === 'night'}
							data-testid="cover-atmosphere-toggle"
						>
							<span className="cover-atmosphere-icon" aria-hidden="true">
								{atmosphere === 'night' ? '☼' : '☾'}
							</span>
							<span>{toggleLabel}</span>
						</button>
					</>
				)}
			</figcaption>
		</figure>
	);
}
