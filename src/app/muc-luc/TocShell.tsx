'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type MouseEvent,
	type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

import { useMotionTier } from '@/components/motion/MotionProvider';
import {
	readInitialClientAtmosphere,
	runAtmosphereViewTransition,
	writeStoredAtmosphere,
	type CoverAtmosphere,
} from '@/components/site/cover/coverAtmosphere';
import { routes } from '@/config/routes';

import styles from './toc.module.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface TocSkyStar {
	x: number;
	y: number;
	r: number;
	opacity: number;
	delaySec: number;
}

const TOC_SKY_STARS: readonly TocSkyStar[] = [
	{ x: 64, y: 120, r: 1.2, opacity: 0.48, delaySec: 0.5 },
	{ x: 148, y: 84, r: 1.4, opacity: 0.6, delaySec: 1.8 },
	{ x: 242, y: 158, r: 1.0, opacity: 0.42, delaySec: 2.7 },
	{ x: 356, y: 92, r: 1.3, opacity: 0.52, delaySec: 1.1 },
	{ x: 472, y: 136, r: 1.0, opacity: 0.38, delaySec: 3.2 },
	{ x: 588, y: 76, r: 1.4, opacity: 0.56, delaySec: 0.8 },
	{ x: 678, y: 144, r: 1.1, opacity: 0.44, delaySec: 2.3 },
	{ x: 758, y: 98, r: 1.5, opacity: 0.64, delaySec: 1.5 },
	{ x: 822, y: 174, r: 1.2, opacity: 0.5, delaySec: 2.9 },
	{ x: 924, y: 108, r: 1.4, opacity: 0.58, delaySec: 0.4 },
	{ x: 956, y: 212, r: 1.1, opacity: 0.46, delaySec: 2.1 },
	{ x: 108, y: 248, r: 1.0, opacity: 0.38, delaySec: 1.6 },
];

interface TocShellProps {
	children: ReactNode;
}

/**
 * Interactive shell for `/muc-luc`:
 * - Shares Dawn/Night atmosphere seamlessly with `/` (0ms pre-paint bootstrap, zero white flash).
 * - Displays the full bottom-anchored mountain valley panorama (sun/moon intact on desktop)
 *   with ultra-quiet parallax and subtle sky accents.
 * - Supports quick keyboard navigation (`1` -> Về tôi, `2` -> Học tập) when no input/dialog is open.
 */
export default function TocShell({ children }: TocShellProps) {
	const router = useRouter();
	const { allowsAmbient, reduced } = useMotionTier();
	const mainRef = useRef<HTMLElement>(null);
	const [atmosphere, setAtmosphere] = useState<CoverAtmosphere>('dawn');
	const [ready, setReady] = useState(false);

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

	// 60fps pointer parallax directly via CSS custom properties (zero React re-renders or reflows)
	useEffect(() => {
		const el = mainRef.current;
		if (!el || !allowsAmbient) return;

		let pending = 0;
		let latestX = 0;
		let latestY = 0;
		let cachedRect: DOMRect | null = null;

		const invalidate = () => {
			cachedRect = null;
		};

		const paint = () => {
			pending = 0;
			if (!cachedRect) cachedRect = el.getBoundingClientRect();
			if (!cachedRect.width || !cachedRect.height) return;
			const gx = ((latestX - cachedRect.left) / cachedRect.width - 0.5) * 2;
			const gy = ((latestY - cachedRect.top) / cachedRect.height - 0.5) * 2;
			el.style.setProperty('--toc-gaze-x', Math.max(-1, Math.min(1, gx)).toFixed(3));
			el.style.setProperty('--toc-gaze-y', Math.max(-1, Math.min(1, gy)).toFixed(3));
		};

		const onMove = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			latestX = event.clientX;
			latestY = event.clientY;
			if (!pending) pending = requestAnimationFrame(paint);
		};

		const onReset = () => {
			if (pending) cancelAnimationFrame(pending);
			pending = 0;
			el.style.removeProperty('--toc-gaze-x');
			el.style.removeProperty('--toc-gaze-y');
		};

		const observer = new ResizeObserver(invalidate);
		observer.observe(el);
		window.addEventListener('resize', invalidate, { passive: true });
		el.addEventListener('pointerenter', invalidate);
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerleave', onReset);
		el.addEventListener('pointercancel', onReset);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', invalidate);
			el.removeEventListener('pointerenter', invalidate);
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerleave', onReset);
			el.removeEventListener('pointercancel', onReset);
			onReset();
		};
	}, [allowsAmbient]);

	// Quiet desktop keyboard shortcuts: 1 -> Về tôi, 2 -> Học tập
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.tagName === 'SELECT' ||
					target.isContentEditable)
			) {
				return;
			}
			if (document.querySelector('[role="dialog"]')) return;

			if (event.key === '1') {
				router.push(routes.contact);
			} else if (event.key === '2') {
				router.push(routes.learnCourses);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [router]);

	const handleToggleAtmosphere = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const root = document.documentElement;
			const current = root.dataset.coverAtmosphere === 'night' ? 'night' : 'dawn';
			const next: CoverAtmosphere = current === 'night' ? 'dawn' : 'night';
			writeStoredAtmosphere(next);

			const btnRect = event.currentTarget.getBoundingClientRect();
			const clientX =
				event.detail > 0 ? Math.round(event.clientX) : Math.round(btnRect.left + btnRect.width / 2);
			const clientY =
				event.detail > 0 ? Math.round(event.clientY) : Math.round(btnRect.top + btnRect.height / 2);

			runAtmosphereViewTransition({
				clientX,
				clientY,
				reduced,
				commit: (usingViewTransition) => {
					const apply = () => {
						root.dataset.coverAtmosphere = next;
						setAtmosphere(next);
					};
					if (usingViewTransition) {
						flushSync(apply);
					} else {
						apply();
					}
				},
			});
		},
		[reduced],
	);

	const toggleLabel = atmosphere === 'night' ? 'Gọi bình minh' : 'Gọi đêm sao';

	return (
		<main
			ref={mainRef}
			className={`personal-book ${styles.page}`}
			data-testid="gate-home"
			data-atmosphere={atmosphere}
			data-atmosphere-ready={ready ? 'true' : undefined}
		>
			{/* Panoramic horizon anchored along the bottom with true alpha mask fade (zero seam) */}
			<div className={styles.horizonWrap} aria-hidden="true">
				<div className={styles.horizonParallax}>
					<Image
						src="/brand/toc-journey.webp"
						alt=""
						fill
						sizes="100vw"
						loading="eager"
						className={`${styles.landscape} ${styles.landscapeDawn}`}
					/>
					<Image
						src="/brand/toc-journey-night.webp"
						alt=""
						fill
						sizes="100vw"
						loading="eager"
						className={`${styles.landscape} ${styles.landscapeNight}`}
					/>
				</div>

				{/* Quiet sky accents: faint gliding ink birds (Dawn) / serene twinkling stars (Night) */}
				<svg
					className={styles.skyOverlay}
					viewBox="0 0 1000 420"
					preserveAspectRatio="xMidYMid slice"
				>
					<g className={styles.dawnBirds}>
						<path
							className={`${styles.inkBird} ${styles.inkBirdA}`}
							d="M 612 96 Q 620 89 626 95 Q 632 89 640 96"
						/>
						<path
							className={`${styles.inkBird} ${styles.inkBirdB}`}
							d="M 656 122 Q 662 117 667 121 Q 672 117 678 122"
						/>
					</g>
					<g className={styles.nightStars}>
						<path className={styles.celestialArc} d="M 40 170 A 560 420 0 0 1 960 110" />
						{TOC_SKY_STARS.map((star) => (
							<circle
								key={`${star.x}-${star.y}`}
								className={styles.starDot}
								cx={star.x}
								cy={star.y}
								r={star.r}
								style={{
									opacity: star.opacity,
									animationDelay: `${star.delaySec}s`,
								}}
							/>
						))}
					</g>
				</svg>
			</div>

			<div className={styles.content}>
				<div className={styles.header}>
					<div className={styles.metaRow}>
						<p className={styles.eyebrow}>Mục lục · Nguyễn Duy Khánh</p>
						<Link href={routes.home} className={styles.backLink} data-testid="toc-back-cover">
							<span aria-hidden="true">←</span>
							<span>Về trang bìa</span>
						</Link>
					</div>
					<h1>Bạn muốn ghé đâu?</h1>
					<p className={styles.lead}>Một chút về tôi. Và những điều để học.</p>
				</div>

				{children}
			</div>

			<div className={styles.footer}>
				<div className={styles.footerInner}>
					<span className={styles.footerNote}>Chưa xong. Và vẫn đang tiếp tục.</span>
					<button
						type="button"
						className={styles.atmosphereToggle}
						onClick={handleToggleAtmosphere}
						aria-pressed={atmosphere === 'night'}
						data-testid="toc-atmosphere-toggle"
					>
						<span className={styles.atmosphereIcon} aria-hidden="true">
							{atmosphere === 'night' ? '☼' : '☾'}
						</span>
						<span>{toggleLabel}</span>
					</button>
				</div>
			</div>
		</main>
	);
}
