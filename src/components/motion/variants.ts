import { distance, duration, ease } from './tokens';

export const fadeUp = {
	hidden: { opacity: 0, y: distance.section },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: duration.section, ease: ease.reveal },
	},
};

export const fadeIn = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: duration.ui, ease: ease.transition },
	},
};

export const imageReveal = {
	hidden: { opacity: 0, scale: 1.04 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: duration.image, ease: ease.reveal },
	},
};

export const staggerContainer = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.04,
		},
	},
};

export const pageEntrance = {
	initial: { opacity: 0.94, y: distance.ui },
	animate: {
		opacity: 1,
		y: 0,
		transition: { duration: duration.page, ease: ease.reveal },
	},
};

export const textMaskReveal = {
	hidden: { y: '110%' },
	visible: {
		y: 0,
		transition: { duration: duration.textMask, ease: ease.reveal },
	},
};

export const underlineDraw = {
	hidden: { scaleX: 0 },
	visible: {
		scaleX: 1,
		transition: { duration: duration.underline, ease: ease.reveal },
	},
};

export const sealVariants = {
	hidden: { opacity: 0, scale: 0.72 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: duration.seal, ease: ease.reveal },
	},
};
