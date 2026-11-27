export type CoverAtmosphere = 'dawn' | 'night';

export interface BloomOrigin {
	/** Viewport coordinates (for full-screen View Transition bloom). */
	clientX: number;
	clientY: number;
	/** Normalized 0..1 plate coordinates (for SVG fallback & canvas frontier). */
	plateX: number;
	plateY: number;
}

type ViewTransitionLike = {
	finished: Promise<void>;
	skipTransition?: () => void;
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (update: () => void) => ViewTransitionLike;
};

let activeBloomToken = 0;
let activeViewTransition: ViewTransitionLike | null = null;

/**
 * Interruptible full-viewport atmosphere transition shared by `/` and `/muc-luc`.
 * Rapid clicks cancel any in-flight View Transition and stamp a monotonic token so
 * stale `.finally()` handlers never strip `.cover-blooming` mid-bloom or drop clicks.
 */
export function runAtmosphereViewTransition(options: {
	clientX: number;
	clientY: number;
	reduced: boolean;
	commit: (usingViewTransition: boolean) => void;
	onFinish?: () => void;
}): void {
	const { clientX, clientY, reduced, commit, onFinish } = options;
	const root = document.documentElement;
	const doc = document as ViewTransitionDocument;

	activeBloomToken += 1;
	const token = activeBloomToken;

	if (activeViewTransition) {
		try {
			activeViewTransition.skipTransition?.();
		} catch {
			// Ignore already-finished transition errors.
		}
		activeViewTransition = null;
	}

	const canViewTransition = !reduced && typeof doc.startViewTransition === 'function';
	if (!canViewTransition) {
		root.classList.remove('cover-blooming');
		commit(false);
		onFinish?.();
		return;
	}

	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const maxCorner = Math.max(
		Math.hypot(clientX, clientY),
		Math.hypot(vw - clientX, clientY),
		Math.hypot(clientX, vh - clientY),
		Math.hypot(vw - clientX, vh - clientY),
	);
	// Precompute concrete pixel lengths for every registered @property lobe so Blink/WebKit
	// smoothly interpolate all four mist layers past every viewport corner without end pop.
	const max1 = Math.ceil(maxCorner + 560);
	const max2 = Math.ceil(maxCorner + Math.hypot(vw * 0.18, vh * 0.12) + 520);
	const max3 = Math.ceil(maxCorner + Math.hypot(vw * 0.15, vh * 0.16) + 500);
	const sweepMax = Math.ceil(Math.hypot(vw, vh) + 680);

	root.style.setProperty('--cover-bloom-x', `${Math.round(clientX)}px`);
	root.style.setProperty('--cover-bloom-y', `${Math.round(clientY)}px`);
	root.style.setProperty('--cover-bloom-r1-a', `${Math.round(max1 * 0.24)}px`);
	root.style.setProperty('--cover-bloom-r1-b', `${Math.round(max1 * 0.62)}px`);
	root.style.setProperty('--cover-bloom-r1-end', `${max1}px`);
	root.style.setProperty('--cover-bloom-r2-b', `${Math.round(max2 * 0.46)}px`);
	root.style.setProperty('--cover-bloom-r2-end', `${max2}px`);
	root.style.setProperty('--cover-bloom-r3-b', `${Math.round(max3 * 0.68)}px`);
	root.style.setProperty('--cover-bloom-r3-end', `${max3}px`);
	root.style.setProperty('--cover-bloom-sweep-b', `${Math.round(sweepMax * 0.44)}px`);
	root.style.setProperty('--cover-bloom-sweep-end', `${sweepMax}px`);
	root.classList.add('cover-blooming');

	try {
		const transition = doc.startViewTransition!(() => {
			commit(true);
		});
		activeViewTransition = transition;
		transition.finished
			.catch(() => undefined)
			.finally(() => {
				if (activeBloomToken !== token) return;
				activeViewTransition = null;
				root.classList.remove('cover-blooming');
				onFinish?.();
			});
	} catch {
		if (activeBloomToken !== token) return;
		activeViewTransition = null;
		root.classList.remove('cover-blooming');
		commit(false);
		onFinish?.();
	}
}

export const COVER_ATMOSPHERE_STORAGE_KEY = 'dk-cover-atmosphere-v1';

/**
 * Synchronous pre-paint bootstrap shared by `/` and `/muc-luc` so evening visitors
 * open straight into Night indigo at 0ms (no Dawn flash). Without JS, SSR stays warm Dawn paper.
 */
export const COVER_ATMOSPHERE_BOOTSTRAP_SCRIPT = `(()=>{try{var p=new URLSearchParams(location.search).get('mode');var s=sessionStorage.getItem('${COVER_ATMOSPHERE_STORAGE_KEY}');var h=new Date().getHours();var m=p==='dawn'||p==='night'?p:s==='dawn'||s==='night'?s:(h>=6&&h<18?'dawn':'night');document.documentElement.dataset.coverAtmosphere=m;}catch(e){}})();`;

/** Hours 06:00–17:59 open in warm Dawn paper; 18:00–05:59 open in serene Night indigo. */
export function resolveTimeAtmosphere(date: Date = new Date()): CoverAtmosphere {
	const hour = date.getHours();
	return hour >= 6 && hour < 18 ? 'dawn' : 'night';
}

export function parseAtmosphereParam(value: string | null | undefined): CoverAtmosphere | null {
	if (value === 'dawn' || value === 'night') return value;
	return null;
}

export function readStoredAtmosphere(): CoverAtmosphere | null {
	if (typeof window === 'undefined') return null;
	try {
		return parseAtmosphereParam(window.sessionStorage.getItem(COVER_ATMOSPHERE_STORAGE_KEY));
	} catch {
		return null;
	}
}

export function writeStoredAtmosphere(atmosphere: CoverAtmosphere): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(COVER_ATMOSPHERE_STORAGE_KEY, atmosphere);
	} catch {
		// Private browsing or blocked storage leaves the cover fully usable.
	}
}

export function readInitialClientAtmosphere(): CoverAtmosphere {
	if (typeof window === 'undefined') return 'dawn';
	const fromDataset = parseAtmosphereParam(document.documentElement.dataset.coverAtmosphere);
	if (fromDataset) return fromDataset;
	const params = new URLSearchParams(window.location.search);
	return (
		parseAtmosphereParam(params.get('mode')) ?? readStoredAtmosphere() ?? resolveTimeAtmosphere()
	);
}

export interface CoverStar {
	x: number;
	y: number;
	r: number;
	opacity: number;
	delaySec: number;
	constellation?: boolean;
}

export interface CoverLeafAnchor {
	/** Normalized 0..1 coordinates inside the artwork plate. */
	x: number;
	y: number;
	size: number;
	baseAngle: number;
	phase: number;
}

/**
 * Coordinates in normalized 0..1000 artwork plate space.
 * Desktop uses a 6:5 crop of the 1440×900 plate (left 75% visible);
 * Mobile uses the full 4:5 portrait plate (819×1023, zero crop).
 */
export const DESKTOP_SUN_POS = { x: 43.7, y: 30.8 } as const;
export const MOBILE_SUN_POS = { x: 73.2, y: 30.2 } as const;

export const DESKTOP_CONSTELLATION: readonly { x: number; y: number }[] = [
	{ x: 642, y: 274 },
	{ x: 702, y: 236 },
	{ x: 752, y: 266 },
	{ x: 806, y: 204 },
	{ x: 862, y: 242 },
	{ x: 916, y: 176 },
];

export const MOBILE_CONSTELLATION: readonly { x: number; y: number }[] = [
	{ x: 540, y: 162 },
	{ x: 618, y: 132 },
	{ x: 688, y: 158 },
	{ x: 762, y: 112 },
	{ x: 842, y: 144 },
	{ x: 914, y: 98 },
];

/** Quiet hand-curated starfield (avoids cluttering the figure or moon disc). */
export const DESKTOP_STARS: readonly CoverStar[] = [
	{ x: 78, y: 84, r: 1.3, opacity: 0.55, delaySec: 0.4 },
	{ x: 146, y: 132, r: 1.0, opacity: 0.4, delaySec: 1.8 },
	{ x: 242, y: 74, r: 1.4, opacity: 0.62, delaySec: 0.9 },
	{ x: 318, y: 112, r: 1.0, opacity: 0.42, delaySec: 2.5 },
	{ x: 534, y: 96, r: 1.2, opacity: 0.52, delaySec: 1.2 },
	{ x: 592, y: 152, r: 1.0, opacity: 0.45, delaySec: 3.1 },
	{ x: 668, y: 108, r: 1.5, opacity: 0.68, delaySec: 0.6 },
	{ x: 734, y: 142, r: 1.1, opacity: 0.48, delaySec: 2.2 },
	{ x: 856, y: 94, r: 1.3, opacity: 0.58, delaySec: 1.6 },
	{ x: 938, y: 122, r: 1.0, opacity: 0.44, delaySec: 2.9 },
	{ x: 948, y: 298, r: 1.3, opacity: 0.52, delaySec: 0.7 },
	{ x: 892, y: 368, r: 1.1, opacity: 0.42, delaySec: 2.4 },
	{ x: 794, y: 344, r: 1.2, opacity: 0.48, delaySec: 1.4 },
	{ x: 718, y: 406, r: 1.0, opacity: 0.36, delaySec: 3.3 },
	{ x: 858, y: 484, r: 1.1, opacity: 0.38, delaySec: 1.9 },
	{ x: 936, y: 544, r: 1.0, opacity: 0.34, delaySec: 2.7 },
	{ x: 642, y: 274, r: 2.0, opacity: 0.78, delaySec: 0.3, constellation: true },
	{ x: 702, y: 236, r: 1.9, opacity: 0.74, delaySec: 1.5, constellation: true },
	{ x: 752, y: 266, r: 1.8, opacity: 0.7, delaySec: 2.1, constellation: true },
	{ x: 806, y: 204, r: 2.6, opacity: 0.92, delaySec: 0.8, constellation: true },
	{ x: 862, y: 242, r: 1.9, opacity: 0.74, delaySec: 2.6, constellation: true },
	{ x: 916, y: 176, r: 2.1, opacity: 0.82, delaySec: 1.1, constellation: true },
];

export const MOBILE_STARS: readonly CoverStar[] = [
	{ x: 112, y: 78, r: 1.3, opacity: 0.52, delaySec: 0.5 },
	{ x: 208, y: 56, r: 1.1, opacity: 0.45, delaySec: 1.9 },
	{ x: 392, y: 84, r: 1.4, opacity: 0.6, delaySec: 1.1 },
	{ x: 472, y: 126, r: 1.0, opacity: 0.44, delaySec: 2.6 },
	{ x: 540, y: 162, r: 2.0, opacity: 0.76, delaySec: 0.4, constellation: true },
	{ x: 618, y: 132, r: 1.8, opacity: 0.72, delaySec: 1.7, constellation: true },
	{ x: 688, y: 158, r: 1.8, opacity: 0.7, delaySec: 2.3, constellation: true },
	{ x: 762, y: 112, r: 2.6, opacity: 0.92, delaySec: 0.8, constellation: true },
	{ x: 842, y: 144, r: 1.8, opacity: 0.74, delaySec: 2.8, constellation: true },
	{ x: 914, y: 98, r: 2.0, opacity: 0.8, delaySec: 1.2, constellation: true },
	{ x: 896, y: 234, r: 1.2, opacity: 0.48, delaySec: 1.5 },
	{ x: 486, y: 248, r: 1.1, opacity: 0.42, delaySec: 2.9 },
	{ x: 928, y: 374, r: 1.1, opacity: 0.4, delaySec: 0.9 },
];

/** Winding mountain path trace in 0..1000 space (follows the hand-drawn road). */
export const DESKTOP_JOURNEY_PATH =
	'M 484 532 C 470 554, 424 568, 434 592 C 446 616, 514 624, 502 648 C 488 674, 412 686, 428 716 C 446 746, 558 756, 536 798 C 516 838, 456 882, 434 962';

export const MOBILE_JOURNEY_PATH =
	'M 732 586 C 756 604, 796 618, 774 638 C 750 658, 676 664, 704 686 C 734 708, 882 702, 846 728 C 810 754, 718 756, 676 778';

/** Sampled waypoints along the desktop winding road (0..1 space) for tactile path warmth on hover. */
export const DESKTOP_JOURNEY_POINTS: readonly { x: number; y: number }[] = [
	{ x: 0.484, y: 0.532 },
	{ x: 0.456, y: 0.562 },
	{ x: 0.436, y: 0.592 },
	{ x: 0.478, y: 0.622 },
	{ x: 0.502, y: 0.648 },
	{ x: 0.464, y: 0.676 },
	{ x: 0.428, y: 0.714 },
	{ x: 0.494, y: 0.748 },
	{ x: 0.536, y: 0.794 },
	{ x: 0.498, y: 0.848 },
	{ x: 0.462, y: 0.902 },
	{ x: 0.436, y: 0.954 },
];

/** Physics-driven autumn leaf anchors along the lower-right breeze curve (Dawn & subtle Night). */
export const DESKTOP_LEAVES: readonly CoverLeafAnchor[] = [
	{ x: 0.618, y: 0.818, size: 11, baseAngle: -0.42, phase: 0.2 },
	{ x: 0.706, y: 0.862, size: 9, baseAngle: 0.35, phase: 1.9 },
	{ x: 0.564, y: 0.896, size: 10, baseAngle: -0.18, phase: 3.4 },
	{ x: 0.768, y: 0.808, size: 7.5, baseAngle: 0.62, phase: 4.7 },
];
