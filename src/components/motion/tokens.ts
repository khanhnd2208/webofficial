/**
 * Explorer Teacher motion tokens.
 * Tiers: full (desktop) / lite (mobile/coarse) / reduced (prefers-reduced-motion).
 */

export type MotionTier = 'full' | 'lite' | 'reduced';

export const ease = {
	/** Primary signature easing — reveals, masks, journey */
	reveal: [0.32, 0.72, 0, 1] as const,
	/** UI transitions, nav, buttons */
	transition: [0.32, 0.72, 0, 1] as const,
} as const;

export const duration = {
	/** Hover / micro UI feedback */
	hover: 0.15,
	ui: 0.25,
	button: 0.25,
	/** HorizonReveal */
	horizon: 0.4,
	/** Route entrance fade + soft rise */
	page: 0.4,
	/** Gate item exit before navigation */
	gate: 0.4,
	/** Section narrative */
	section: 0.4,
	textMask: 0.4,
	underline: 0.25,
	image: 0.4,
	/** Full hero sequence budget */
	hero: 1.6,
	pathDraw: 0.4,
	seal: 0.25,
	reducedCrossfade: 0.15,
} as const;

export const distance = {
	hover: 2,
	ui: 8,
	section: 8,
	horizon: 20,
	parallaxBg: 24,
	parallaxFigure: 8,
	parallaxText: 16,
} as const;

export const spring = {
	stiffness: 140,
	damping: 28,
	mass: 0.7,
} as const;

export const stagger = {
	default: 0.08,
	tight: 0.05,
	loose: 0.12,
	manifesto: 0.14,
} as const;

/** Hero choreography offsets (seconds within ~1.6s sequence) */
export const heroTimeline = {
	sky: 0,
	canvas: 0,
	wordmark: 0.2,
	landscape: 0.15,
	figure: 0.35,
	headline: 0.5,
	copy: 0.65,
	cta: 0.8,
	journeyLine: 1.0,
	end: 1.6,
} as const;

/**
 * Intro cover choreography (CSS animation-delay seconds).
 * Meta → headline → POS underline → narrative → image → CTA.
 */
export const introTimeline = {
	meta: 0.05,
	headline: 0.18,
	partOfSpeech: 0.42,
	narrative: 0.55,
	image: 0.12,
	cta: 0.78,
} as const;

/**
 * Mục lục gate entrance stagger (CSS animation-delay seconds).
 */
export const gateTimeline = {
	itemBase: 0.12,
	itemStep: 0.08,
	exit: 0.4,
} as const;
