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
	type CSSProperties,
	type MouseEvent,
	type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

import { useMotionTier } from '@/components/motion/MotionProvider';
import {
	readInitialClientAtmosphere,
	writeStoredAtmosphere,
	type CoverAtmosphere,
} from '@/components/site/cover/coverAtmosphere';
import { routes } from '@/config/routes';

import styles from './toc.module.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type ViewTransitionDocument = Document & {
	startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

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
	const [gaze, setGaze] = useState({ x: 0, y: 0 });

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

	const handlePointerMove = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			if (!allowsAmbient || !mainRef.current) return;
			const rect = mainRef.current.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const nx = (event.clientX - rect.left) / rect.width - 0.5;
			const ny = (event.clientY - rect.top) / rect.height - 0.5;
			setGaze({ x: nx * 2, y: ny * 2 });
		},
		[allowsAmbient],
	);

	const handlePointerLeave = useCallback(() => {
		setGaze({ x: 0, y: 0 });
	}, []);

	const handleToggleAtmosphere = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const next: CoverAtmosphere = atmosphere === 'night' ? 'dawn' : 'night';
			writeStoredAtmosphere(next);

			const doc = document as ViewTransitionDocument;
			const canViewTransition = !reduced && typeof doc.startViewTransition === 'function';

			if (!canViewTransition) {
				document.documentElement.dataset.coverAtmosphere = next;
				setAtmosphere(next);
				return;
			}

			const btnRect = event.currentTarget.getBoundingClientRect();
			const clientX =
				event.detail > 0 ? Math.round(event.clientX) : Math.round(btnRect.left + btnRect.width / 2);
			const clientY =
				event.detail > 0 ? Math.round(event.clientY) : Math.round(btnRect.top + btnRect.height / 2);
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const maxRadius =
				Math.max(
					Math.hypot(clientX, clientY),
					Math.hypot(vw - clientX, clientY),
					Math.hypot(clientX, vh - clientY),
					Math.hypot(vw - clientX, vh - clientY),
				) + 140;

			const root = document.documentElement;
			root.style.setProperty('--cover-bloom-x', `${clientX}px`);
			root.style.setProperty('--cover-bloom-y', `${clientY}px`);
			root.style.setProperty('--cover-bloom-max', `${Math.ceil(maxRadius)}px`);
			root.classList.add('cover-blooming');

			try {
				const transition = doc.startViewTransition!(() => {
					flushSync(() => {
						root.dataset.coverAtmosphere = next;
						setAtmosphere(next);
					});
				});
				transition.finished
					.catch(() => undefined)
					.finally(() => {
						root.classList.remove('cover-blooming');
					});
			} catch {
				root.classList.remove('cover-blooming');
				root.dataset.coverAtmosphere = next;
				setAtmosphere(next);
			}
		},
		[atmosphere, reduced],
	);

	const motionVars = {
		'--toc-gaze-x': gaze.x.toFixed(3),
		'--toc-gaze-y': gaze.y.toFixed(3),
	} as CSSProperties;

	const toggleLabel = atmosphere === 'night' ? 'Gọi bình minh' : 'Gọi đêm sao';

	return (
		<main
			ref={mainRef}
			className={`personal-book ${styles.page}`}
			data-testid="gate-home"
			data-atmosphere={atmosphere}
			data-atmosphere-ready={ready ? 'true' : undefined}
			style={motionVars}
			onMouseMove={allowsAmbient ? handlePointerMove : undefined}
			onMouseLeave={allowsAmbient ? handlePointerLeave : undefined}
		>
			{/* Panoramic horizon anchored along the bottom so sun/moon & winding valley remain intact */}
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
				<div className={styles.horizonTopFade} />
			</div>

			<div className={styles.content}>
				<header className={styles.header}>
					<div className={styles.metaRow}>
						<p className={styles.eyebrow}>Mục lục · Nguyễn Duy Khánh</p>
						<Link href={routes.home} className={styles.backLink} data-testid="toc-back-cover">
							<span aria-hidden="true">←</span>
							<span>Về trang bìa</span>
						</Link>
					</div>
					<h1>Bạn muốn ghé đâu?</h1>
					<p className={styles.lead}>Một chút về tôi. Và những điều để học.</p>
				</header>

				{children}
			</div>

			<footer className={styles.footer}>
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
			</footer>
		</main>
	);
}
