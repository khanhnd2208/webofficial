/**
 * Boutique library motion — light fade/translate only (150–250ms).
 */

export type MotionTier = 'full' | 'lite' | 'reduced';

export const ease = {
	/** Reveals, masks, image aperture */
	reveal: [0.16, 1, 0.3, 1] as const,
	/** UI transitions, nav, route fade */
	transition: [0.65, 0, 0.35, 1] as const,
} as const;

export const duration = {
	hover: 0.15,
	ui: 0.2,
	section: 0.22,
	textMask: 0.22,
	image: 0.25,
	page: 0.2,
	hero: 0.25,
	seal: 0.22,
	reducedCrossfade: 0.12,
} as const;

export const distance = {
	hover: 2,
	ui: 6,
	section: 8,
	parallax: 0,
	parallaxLite: 0,
} as const;

export const spring = {
	stiffness: 140,
	damping: 28,
	mass: 0.7,
} as const;

export const stagger = {
	default: 0.04,
	tight: 0.03,
	loose: 0.05,
} as const;

/** Compact hero — no scroll morph choreography */
export const heroTimeline = {
	canvas: 0,
	wordmark: 0,
	wordmarkEnd: 0.2,
	manifesto: 0.04,
	manifestoEnd: 0.22,
	image: 0.06,
	imageEnd: 0.25,
	cta: 0.08,
	ctaEnd: 0.25,
	scrollCue: 0.2,
} as const;
