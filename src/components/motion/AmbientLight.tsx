'use client';

import { m } from 'framer-motion';

import { useMotionTier } from './MotionProvider';

/**
 * Breathing light — full tier only, one layer, desktop fine-pointer.
 */
export default function AmbientLight({ className }: { className?: string }) {
	const { allowsAmbient } = useMotionTier();

	if (!allowsAmbient) return null;

	return (
		<div
			aria-hidden
			className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
		>
			<m.div
				className="absolute -left-1/4 top-0 h-[60%] w-[70%] rounded-full opacity-[0.07]"
				style={{
					background:
						'radial-gradient(ellipse at center, var(--sunlight) 0%, transparent 70%)',
				}}
				animate={{ x: ['0%', '2.5%', '0%'], y: ['0%', '1.5%', '0%'] }}
				transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
			/>
		</div>
	);
}
