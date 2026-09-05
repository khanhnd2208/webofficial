'use client';

import { getImageProps } from 'next/image';
import { useCallback, useEffect, useRef } from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';

type IntroParallaxImageProps = {
	src: string;
	mobileSrc: string;
	alt: string;
	sizes: string;
	className?: string;
};

/**
 * Soft mouse parallax on the intro journey image — full tier only.
 */
export default function IntroParallaxImage({
	src,
	mobileSrc,
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
			const max = 4;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				if (!imgRef.current) return;
				imgRef.current.style.transform = `translate(${x * max}px, ${y * max}px)`;
			});
		},
		[allowsAmbient],
	);

	const onLeave = useCallback(() => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		if (!imgRef.current) return;
		imgRef.current.style.transform = 'translate(0, 0)';
	}, []);

	useEffect(() => {
		if (!allowsAmbient && imgRef.current) imgRef.current.style.transform = 'none';
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [allowsAmbient]);

	const { props: desktop } = getImageProps({ src, alt, fill: true, sizes, loading: 'eager' });
	const { props: mobile } = getImageProps({
		src: mobileSrc,
		alt,
		fill: true,
		sizes: '280px',
		loading: 'eager',
	});
	return (
		<div
			ref={frameRef}
			className={`relative h-full w-full overflow-hidden ${className}`}
			onMouseMove={allowsAmbient ? onMove : undefined}
			onMouseLeave={allowsAmbient ? onLeave : undefined}
		>
			<picture>
				<source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes={sizes} />
				{/* Next getImageProps supplies optimized srcsets for one art-directed image. */}
				<img
					{...mobile}
					ref={imgRef}
					alt={alt}
					className="book-responsive-art intro-image-treatment"
				/>
			</picture>
			<div className="intro-noise-overlay" aria-hidden="true" />
		</div>
	);
}
