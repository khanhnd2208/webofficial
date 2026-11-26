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
	type MouseEvent,
} from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

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
	type CoverAtmosphere,
} from './coverAtmosphere';

interface CoverLivingPlateProps {
	atmosphere: CoverAtmosphere;
	onToggleAtmosphere: () => void;
}

const REVEAL_DURATION_MS = 1250;

function formatPolyline(points: readonly { x: number; y: number }[]): string {
	return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * Living book-cover plate:
 * - Pixel-aligned Dawn & Night indigo ink-wash plates (zero X-ray inversion, zero drift).
 * - Organic rag-paper watercolor reveal mask (SVG feTurbulence + feDisplacementMap) driven
 *   from the sun/moon center or exact pointer click coordinate.
 * - 3-layer paper diorama parallax (far sky -> artwork plate -> foreground drifting leaves).
 * - Quiet life in BOTH modes (gliding ink birds, wind-reactive leaves, golden path shimmer in Dawn;
 *   twinkling starfield, magnetic constellation, soft warm lantern peek in Night).
 * - Bookplate caption bar sits cleanly below the artwork — never overlaps the illustration.
 * - Two native <details> marginalia slips (accessible without JS, Escape/outside-click close).
 */
export default function CoverLivingPlate({
	atmosphere,
	onToggleAtmosphere,
}: CoverLivingPlateProps) {
	const { allowsAmbient, reduced } = useMotionTier();
	const uid = useId().replace(/:/g, '');
	const maskId = `cover-reveal-mask-${uid}`;
	const bleedFilterId = `cover-bleed-filter-${uid}`;
	const lanternGradId = `cover-lantern-grad-${uid}`;

	const frameRef = useRef<HTMLDivElement>(null);
	const personNoteRef = useRef<HTMLDetailsElement>(null);
	const journeyNoteRef = useRef<HTMLDetailsElement>(null);
	const revealCircleRef = useRef<SVGCircleElement>(null);
	const tweenRafRef = useRef<number | null>(null);
	const prevAtmosphereRef = useRef<CoverAtmosphere>(atmosphere);
	const pendingOriginRef = useRef<{ x: number; y: number } | null>(null);
	const pulseCounterRef = useRef(0);

	const [isDesktop, setIsDesktop] = useState(true);
	const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({ w: 720, h: 600 });
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [pathWarmed, setPathWarmed] = useState(false);
	const [pointer, setPointer] = useState({ x: 0.5, y: 0.5, active: false });
	const [gaze, setGaze] = useState({ x: 0, y: 0 });
	const [pulse, setPulse] = useState<TransitionPulse | null>(null);
	const [openNote, setOpenNote] = useState<'person' | 'journey' | null>(null);

	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1024px)');
		const sync = () => setIsDesktop(mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	}, []);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;
		const measure = () => {
			const rect = frame.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				setBoxSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
			}
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(frame);
		return () => observer.disconnect();
	}, []);

	// Close marginalia slips on Escape or outside pointer click
	useEffect(() => {
		if (!openNote) return;
		const closeAll = () => {
			if (personNoteRef.current) personNoteRef.current.open = false;
			if (journeyNoteRef.current) journeyNoteRef.current.open = false;
			setOpenNote(null);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			const activeEl = openNote === 'person' ? personNoteRef.current : journeyNoteRef.current;
			closeAll();
			activeEl?.querySelector('summary')?.focus();
		};
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (personNoteRef.current?.contains(target) || journeyNoteRef.current?.contains(target)) {
				return;
			}
			closeAll();
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	}, [openNote]);

	const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

	// Organic watercolor reveal tween when atmosphere flips (layout effect prevents any 1-frame snap)
	useIsoLayoutEffect(() => {
		const prev = prevAtmosphereRef.current;
		if (prev === atmosphere) return;
		prevAtmosphereRef.current = atmosphere;

		if (tweenRafRef.current) cancelAnimationFrame(tweenRafRef.current);

		const desktopNow = window.matchMedia('(min-width: 1024px)').matches;
		const sunPos = desktopNow ? DESKTOP_SUN_POS : MOBILE_SUN_POS;
		const origin = pendingOriginRef.current ?? { x: sunPos.x / 100, y: sunPos.y / 100 };
		pendingOriginRef.current = null;

		if (reduced) {
			if (revealCircleRef.current) {
				revealCircleRef.current.setAttribute('r', '0');
			}
			setIsTransitioning(false);
			setPulse(null);
			return;
		}

		const frameRect = frameRef.current?.getBoundingClientRect();
		const w = frameRect?.width ? Math.round(frameRect.width) : 720;
		const h = frameRect?.height ? Math.round(frameRect.height) : 600;
		const ox = origin.x * w;
		const oy = origin.y * h;
		// Exact distance to the farthest corner from origin + displacement margin
		const maxR =
			Math.max(
				Math.hypot(ox, oy),
				Math.hypot(w - ox, oy),
				Math.hypot(ox, h - oy),
				Math.hypot(w - ox, h - oy),
			) + 52;
		const startTime = performance.now();
		const durationMs = REVEAL_DURATION_MS;

		// Synchronously prime the SVG reveal circle before first paint to prevent any 1-frame snap
		const initialCircle = revealCircleRef.current;
		if (initialCircle) {
			initialCircle.setAttribute('cx', ox.toFixed(1));
			initialCircle.setAttribute('cy', oy.toFixed(1));
			initialCircle.setAttribute('r', atmosphere === 'dawn' ? '0' : maxR.toFixed(1));
		}

		setIsTransitioning(true);
		setPathWarmed(atmosphere === 'dawn');
		pulseCounterRef.current += 1;
		setPulse({
			id: pulseCounterRef.current,
			from: prev,
			to: atmosphere,
			originX: origin.x,
			originY: origin.y,
			startTime,
			durationMs,
		});

		const step = (now: number) => {
			const rawT = (now - startTime) / durationMs;
			const t = Math.min(Math.max(rawT, 0), 1);
			// Graceful S-curve so the watercolor rag-paper edge blooms visibly across the scene
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
				setIsTransitioning(false);
				setPulse(null);
			}
		};

		tweenRafRef.current = requestAnimationFrame(step);
		return () => {
			if (tweenRafRef.current) cancelAnimationFrame(tweenRafRef.current);
		};
	}, [atmosphere, reduced]);

	const triggerFromSun = useCallback(() => {
		const sunPos = isDesktop ? DESKTOP_SUN_POS : MOBILE_SUN_POS;
		pendingOriginRef.current = { x: sunPos.x / 100, y: sunPos.y / 100 };
		onToggleAtmosphere();
	}, [isDesktop, onToggleAtmosphere]);

	const handlePlateClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const frame = frameRef.current;
			if (frame && event.detail > 0) {
				const rect = frame.getBoundingClientRect();
				const nx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0.05), 0.95);
				const ny = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0.05), 0.95);
				pendingOriginRef.current = { x: nx, y: ny };
			} else {
				const sunPos = isDesktop ? DESKTOP_SUN_POS : MOBILE_SUN_POS;
				pendingOriginRef.current = { x: sunPos.x / 100, y: sunPos.y / 100 };
			}
			onToggleAtmosphere();
		},
		[isDesktop, onToggleAtmosphere],
	);

	const handlePointerMove = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			if (!allowsAmbient || !frameRef.current) return;
			const rect = frameRef.current.getBoundingClientRect();
			const nx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
			const ny = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
			setPointer({ x: nx, y: ny, active: true });
			setGaze({ x: (nx - 0.5) * 2, y: (ny - 0.5) * 2 });
		},
		[allowsAmbient],
	);

	const handlePointerLeave = useCallback(() => {
		setPointer((prev) => ({ ...prev, active: false }));
		setGaze({ x: 0, y: 0 });
	}, []);

	const handleNoteToggle = (which: 'person' | 'journey', nextOpen: boolean) => {
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
		sizes: '(min-width: 1024px) 62vw, 340px',
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
		sizes: '(min-width: 1024px) 62vw, 340px',
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

	const showNightLayer = atmosphere === 'night' || isTransitioning;
	const nightMaskActive =
		isTransitioning || (atmosphere === 'night' && allowsAmbient && pointer.active);

	const stageVars = {
		'--gaze-x': gaze.x.toFixed(3),
		'--gaze-y': gaze.y.toFixed(3),
		'--sun-x': `${sunPos.x}%`,
		'--sun-y': `${sunPos.y}%`,
	} as CSSProperties;

	const lanternX = (pointer.x * boxSize.w).toFixed(1);
	const lanternY = (pointer.y * boxSize.h).toFixed(1);
	const lanternR = Math.round(Math.min(boxSize.w, boxSize.h) * 0.145);

	const toggleLabel = atmosphere === 'night' ? 'Chạm để gọi bình minh' : 'Chạm để gọi đêm sao';
	const plateStatus = atmosphere === 'night' ? 'Đêm sao · Hà Nội' : 'Bình minh · Hà Nội';

	return (
		<figure className="cover-plate-figure" style={stageVars}>
			<div
				ref={frameRef}
				className="cover-plate-frame"
				data-atmosphere={atmosphere}
				data-transitioning={isTransitioning ? 'true' : undefined}
				onMouseMove={allowsAmbient ? handlePointerMove : undefined}
				onMouseLeave={allowsAmbient ? handlePointerLeave : undefined}
			>
				{/* Inline SVG organic paper-bleed mask definition */}
				<svg
					className="cover-mask-defs"
					width={boxSize.w}
					height={boxSize.h}
					viewBox={`0 0 ${boxSize.w} ${boxSize.h}`}
					aria-hidden="true"
				>
					<defs>
						<filter id={bleedFilterId} x="-18%" y="-18%" width="136%" height="136%">
							<feTurbulence
								type="fractalNoise"
								baseFrequency="0.019"
								numOctaves="3"
								seed="7"
								result="paperNoise"
							/>
							<feDisplacementMap
								in="SourceGraphic"
								in2="paperNoise"
								scale="34"
								xChannelSelector="R"
								yChannelSelector="G"
								result="displaced"
							/>
							<feGaussianBlur in="displaced" stdDeviation="5" />
						</filter>
						<radialGradient id={lanternGradId}>
							<stop offset="0%" stopColor="black" stopOpacity="0.34" />
							<stop offset="56%" stopColor="black" stopOpacity="0.14" />
							<stop offset="100%" stopColor="black" stopOpacity="0" />
						</radialGradient>
						<mask
							id={maskId}
							maskUnits="userSpaceOnUse"
							x="0"
							y="0"
							width={boxSize.w}
							height={boxSize.h}
						>
							<rect width={boxSize.w} height={boxSize.h} fill="white" />
							{atmosphere === 'night' && !isTransitioning && allowsAmbient && pointer.active ? (
								<circle cx={lanternX} cy={lanternY} r={lanternR} fill={`url(#${lanternGradId})`} />
							) : null}
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

				{/* Layer 1: Warm Dawn artwork plate + quiet living dawn overlays */}
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
								className="cover-plate-img intro-image-treatment"
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

					{/* Near foreground layer (1.75x parallax): subtle wind-reactive ochre autumn leaves */}
					<svg
						className="cover-foreground-leaves cover-parallax-near"
						viewBox="0 0 1000 1000"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<g
							className="cover-leaf cover-leaf-1"
							transform={isDesktop ? 'translate(612, 818)' : 'translate(744, 836)'}
						>
							<path d="M 0 0 C 7 -5, 16 -4, 21 2 C 14 7, 5 6, 0 0 Z" />
						</g>
						<g
							className="cover-leaf cover-leaf-2"
							transform={isDesktop ? 'translate(696, 868)' : 'translate(838, 862)'}
						>
							<path d="M 0 0 C 5 -4, 13 -3, 17 2 C 11 6, 4 5, 0 0 Z" />
						</g>
						<g
							className="cover-leaf cover-leaf-3"
							transform={isDesktop ? 'translate(546, 898)' : 'translate(674, 912)'}
						>
							<path d="M 0 0 C 6 -4, 14 -2, 18 3 C 12 6, 4 5, 0 0 Z" />
						</g>
					</svg>
				</div>

				{/* Layer 2: Nocturnal Indigo ink-wash plate masked by organic watercolor bleed */}
				<div
					className="cover-layer-night"
					style={{
						opacity: showNightLayer ? 1 : 0,
						mask: nightMaskActive ? `url(#${maskId})` : undefined,
						WebkitMask: nightMaskActive ? `url(#${maskId})` : undefined,
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

					{/* Far sky layer (0.35x parallax): serene celestial arc, twinkling stars, constellation */}
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

				{/* Subtle antique paper texture + atmospheric watercolor frontier canvas */}
				<div className="intro-noise-overlay" aria-hidden="true" />
				<CoverAtmosphereCanvas
					atmosphere={atmosphere}
					isDesktop={isDesktop}
					allowsAmbient={allowsAmbient}
					reduced={reduced}
					pointer={pointer}
					pulse={pulse}
				/>

				{/* Full-plate quiet click surface (natural cursor, toggles Dawn <-> Night from touch point) */}
				<button
					type="button"
					className="cover-plate-surface-btn"
					onClick={handlePlateClick}
					aria-label={toggleLabel}
					aria-pressed={atmosphere === 'night'}
					data-testid="cover-plate-toggle"
				/>

				{/* Natural focal point: sun/moon disc trigger with whisper-soft breathing halo */}
				<button
					type="button"
					className="cover-celestial-trigger"
					onClick={triggerFromSun}
					aria-label={
						atmosphere === 'night'
							? 'Chạm vào mặt trăng để gọi bình minh'
							: 'Chạm vào mặt trời để gọi đêm sao'
					}
					title={toggleLabel}
				>
					<span className="cover-celestial-ring" aria-hidden="true" />
				</button>

				{/* Quiet marginalia hotspot 1: Explorer / Guiding star -> Về tôi */}
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
						<span className="cover-marginalia-glyph" aria-hidden="true" />
					</summary>
					<div className="cover-marginalia-slip" role="note">
						<p>{introPage.marginalia.person.note}</p>
						<Link href={routes.contact} className="cover-marginalia-link">
							{introPage.marginalia.person.linkLabel}
							<span aria-hidden="true">→</span>
						</Link>
					</div>
				</details>

				{/* Quiet marginalia hotspot 2: Winding mountain path -> Học tập */}
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
						<span className="cover-marginalia-glyph" aria-hidden="true" />
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

			{/* Archival bookplate caption bar below the artwork (never overlaps the drawing) */}
			<figcaption className="cover-plate-bar">
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
			</figcaption>
		</figure>
	);
}
