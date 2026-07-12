'use client';

import { AnimatePresence, m } from 'framer-motion';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type CompletionSealProps = {
	/** Show seal when true */
	show: boolean;
	/** Only animate entrance when this is a fresh completion (not already done on load) */
	animateEntrance?: boolean;
	label?: string;
};

/**
 * Quiet vermilion seal — soft scale + warm halo ~700ms.
 * No confetti. No layout thrash. Reward only on real state change.
 */
export default function CompletionSeal({
	show,
	animateEntrance = true,
	label = 'Hoàn thành',
}: CompletionSealProps) {
	const { reduced, allowsReveal } = useMotionTier();
	const shouldAnimate = animateEntrance && allowsReveal && !reduced;

	return (
		<AnimatePresence>
			{show ? (
				<m.div
					key="seal"
					className="relative inline-flex items-center justify-center"
					initial={shouldAnimate ? { opacity: 0, scale: 0.86 } : false}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{
						duration: shouldAnimate ? duration.seal : duration.reducedCrossfade,
						ease: ease.reveal,
					}}
				>
					{shouldAnimate ? (
						<m.span
							aria-hidden
							className="absolute inset-[-12px] rounded-full bg-sunlight/35 blur-md"
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 0.8, 0.3] }}
							transition={{ duration: duration.seal, ease: ease.reveal }}
						/>
					) : null}
					<span className="relative inline-flex items-center gap-2 rounded-[10px] border-2 border-vermilion px-4 py-2 font-display text-sm font-semibold tracking-wide text-vermilion">
						<span
							aria-hidden
							className="flex h-5 w-5 items-center justify-center rounded-full bg-vermilion text-[10px] font-bold text-paper"
						>
							✓
						</span>
						{label}
					</span>
				</m.div>
			) : null}
		</AnimatePresence>
	);
}
