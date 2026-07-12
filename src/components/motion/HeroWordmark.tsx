'use client';

import { m, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';

import { useMotionTier } from './MotionProvider';
import { duration, ease, heroTimeline } from './tokens';

type HeroWordmarkProps = {
	/** Scroll progress of the hero section (0–1). */
	scrollProgress: MotionValue<number>;
};

/**
 * Hero wordmark — always readable on first paint.
 * Morph only on `full` tier; lite/reduced keep static wordmark (navbar stays visible on narrow).
 */
export default function HeroWordmark({ scrollProgress }: HeroWordmarkProps) {
	const { tier, allowsReveal } = useMotionTier();
	const scale = useTransform(scrollProgress, [0, 0.35], [1, 0.22]);
	const opacity = useTransform(scrollProgress, [0, 0.28, 0.4], [1, 0.55, 0]);
	const y = useTransform(scrollProgress, [0, 0.35], [0, -36]);

	useMotionValueEvent(scrollProgress, 'change', (v) => {
		if (tier !== 'full') return;
		const owned = v > 0.28;
		window.dispatchEvent(
			new CustomEvent('hanoicam:wordmark-morph', {
				detail: { progress: Math.min(v / 0.35, 1), owned },
			}),
		);
	});

	useEffect(() => {
		// Non-full: navbar always owns brand on home (no morph hide)
		if (tier !== 'full') {
			window.dispatchEvent(
				new CustomEvent('hanoicam:wordmark-morph', { detail: { progress: 1, owned: true } }),
			);
			return;
		}
		window.dispatchEvent(
			new CustomEvent('hanoicam:wordmark-morph', { detail: { progress: 0, owned: false } }),
		);
		return () => {
			window.dispatchEvent(
				new CustomEvent('hanoicam:wordmark-morph', { detail: { progress: 1, owned: true } }),
			);
		};
	}, [tier]);

	if (tier !== 'full' || !allowsReveal) {
		return <h1 className="font-display type-wordmark font-semibold text-ink">HANOICAM</h1>;
	}

	return (
		<m.h1
			className="font-display type-wordmark font-semibold text-ink will-change-transform"
			style={{ scale, opacity, y, transformOrigin: 'left top' }}
			initial={{ opacity: 0.94 }}
			animate={{ opacity: 1 }}
			transition={{
				duration: duration.textMask,
				ease: ease.reveal,
				delay: heroTimeline.wordmark,
			}}
		>
			HANOICAM
		</m.h1>
	);
}
