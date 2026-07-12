/**
 * Absolute Cinema — Quiet Cinematic Editorial
 * Shared motion physics. One physics across the site.
 */

export type MotionTier = 'full' | 'lite' | 'reduced';

export const ease = {
	/** Reveals, masks, image aperture */
	reveal: [0.16, 1, 0.3, 1] as const,
	/** UI transitions, nav, route fade */
	transition: [0.65, 0, 0.35, 1] as const,
} as const;

export const duration = {
	hover: 0.18,
	ui: 0.3,
	section: 0.6,
	textMask: 0.8,
	image: 0.9,
	page: 0.28,
	hero: 1.15,
	seal: 0.7,
	reducedCrossfade: 0.12,
} as const;

export const distance = {
	hover: 3,
	ui: 8,
	section: 14,
	parallax: 32,
	parallaxLite: 0,
} as const;

export const spring = {
	stiffness: 120,
	damping: 24,
	mass: 0.8,
} as const;

export const stagger = {
	default: 0.05,
	tight: 0.045,
	loose: 0.06,
} as const;

/** Hero choreography — total ≤ 1.2s; delays kept short so first frame stays readable */
export const heroTimeline = {
	canvas: 0,
	wordmark: 0,
	wordmarkEnd: 0.72,
	manifesto: 0.08,
	manifestoEnd: 0.75,
	image: 0.12,
	imageEnd: 0.95,
	cta: 0.16,
	ctaEnd: 0.85,
	scrollCue: 0.9,
} as const;
