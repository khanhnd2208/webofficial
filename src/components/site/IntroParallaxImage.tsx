'use client';

import Image from 'next/image';
import { useCallback, useRef } from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';

type IntroParallaxImageProps = {
	src: string;
	alt: string;
	sizes: string;
	className?: string;
};

/**
 * Soft mouse parallax on the intro journey image — full tier only.
 */
export default function IntroParallaxImage({
	src,
	alt,
	sizes,
	className = '',
}: IntroParallaxImageProps) {
	const { allowsAmbient } = useMotionTier();
	const frameRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const rafRef = useRef<number | null>(null);

	const onMove = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (!allowsAmbient || !frameRef.current || !imgRef.current) return;
			const rect = frameRef.current.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width - 0.5;
			const y = (event.clientY - rect.top) / rect.height - 0.5;
			const max = 8;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				if (!imgRef.current) return;
				imgRef.current.style.transform = `scale(1.04) translate(${x * max}px, ${y * max}px)`;
			});
		},
		[allowsAmbient],
	);

	const onLeave = useCallback(() => {
		if (!imgRef.current) return;
		imgRef.current.style.transform = 'scale(1) translate(0, 0)';
	}, []);

	return (
		<div
			ref={frameRef}
			className={`relative h-full w-full overflow-hidden ${className}`}
			onMouseMove={allowsAmbient ? onMove : undefined}
			onMouseLeave={allowsAmbient ? onLeave : undefined}
		>
			<Image
				ref={imgRef}
				src={src}
				alt={alt}
				fill
				priority
				sizes={sizes}
				className="intro-image-treatment object-cover object-left transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
			/>
			<div className="intro-noise-overlay" aria-hidden="true" />
		</div>
	);
}
