'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';

import type { MotionTier } from './tokens';

type MotionContextValue = {
	tier: MotionTier;
	reduced: boolean;
	allowsAmbient: boolean;
	allowsReveal: boolean;
};

const MotionTierContext = createContext<MotionContextValue>({
	tier: 'lite',
	reduced: false,
	allowsAmbient: false,
	allowsReveal: true,
});

function detectTier(): MotionTier {
	if (typeof window === 'undefined') return 'lite';
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reducedMotion) return 'reduced';
	const liteViewport = window.matchMedia('(max-width: 1023px)').matches;
	const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
	const saveData = Boolean(connection?.saveData);
	if (saveData || liteViewport || coarsePointer) return 'lite';
	return 'full';
}

function buildValue(tier: MotionTier): MotionContextValue {
	return {
		tier,
		reduced: tier === 'reduced',
		allowsAmbient: tier === 'full',
		allowsReveal: tier !== 'reduced',
	};
}

/**
 * Site-wide motion shell.
 * Components must read tier from context — do not invent local motion policy.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
	const [tier, setTier] = useState<MotionTier>('lite');

	useEffect(() => {
		const apply = () => setTier(detectTier());
		apply();
		const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mqLite = window.matchMedia('(max-width: 1023px)');
		const mqCoarse = window.matchMedia('(pointer: coarse)');
		mqReduce.addEventListener('change', apply);
		mqLite.addEventListener('change', apply);
		mqCoarse.addEventListener('change', apply);
		return () => {
			mqReduce.removeEventListener('change', apply);
			mqLite.removeEventListener('change', apply);
			mqCoarse.removeEventListener('change', apply);
		};
	}, []);

	const value = useMemo(() => buildValue(tier), [tier]);

	return (
		<LazyMotion features={domAnimation} strict>
			<MotionConfig reducedMotion="user">
				<MotionTierContext.Provider value={value}>{children}</MotionTierContext.Provider>
			</MotionConfig>
		</LazyMotion>
	);
}

export function useMotionTier(): MotionContextValue {
	return useContext(MotionTierContext);
}

/** @deprecated Prefer useMotionTier — kept for gradual migration */
export function useMotionTierSafe() {
	return useMotionTier();
}
