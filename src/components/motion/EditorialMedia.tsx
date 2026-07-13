'use client';

import Image from 'next/image';
import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import EditorialCover from './EditorialCover';
import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type EditorialMediaProps = {
	src?: string | null;
	alt: string;
	title: string;
	kicker?: string | null;
	index?: string | number | null;
	aspectRatio?: string;
	className?: string;
	priority?: boolean;
	children?: ReactNode;
};

function canOptimize(src: string): boolean {
	if (src.startsWith('/')) return true;
	try {
		const host = new URL(src).hostname;
		return (
			host === 'toiladuykhanh.com' ||
			host === 'www.toiladuykhanh.com' ||
			host === 'lh3.googleusercontent.com' ||
			host.endsWith('.googleusercontent.com')
		);
	} catch {
		return false;
	}
}

/**
 * Paper aperture for real images; falls back to EditorialCover when src missing.
 * Uses next/image for known hosts / local paths (LCP-friendly when priority).
 */
export default function EditorialMedia({
	src,
	alt,
	title,
	kicker,
	index,
	aspectRatio = '16 / 10',
	className,
	priority = false,
	children,
}: EditorialMediaProps) {
	const { allowsReveal, reduced } = useMotionTier();

	if (!src) {
		return (
			<EditorialCover
				title={title}
				kicker={kicker}
				index={index}
				aspectRatio={aspectRatio}
				className={className}
			/>
		);
	}

	const media =
		children ??
		(canOptimize(src) ? (
			<Image
				src={src}
				alt={alt}
				width={1200}
				height={750}
				className="h-full w-full object-cover"
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
				priority={priority}
			/>
		) : (
			<img
				src={src}
				alt={alt}
				width={1200}
				height={750}
				className="h-full w-full object-cover"
				loading={priority ? 'eager' : 'lazy'}
				fetchPriority={priority ? 'high' : 'auto'}
				decoding="async"
			/>
		));

	if (!allowsReveal) {
		return (
			<div
				className={`overflow-hidden rounded-[var(--radius-media)] bg-paper ${className ?? ''}`}
				style={{ aspectRatio }}
			>
				{media}
			</div>
		);
	}

	return (
		<m.div
			className={`overflow-hidden rounded-[var(--radius-media)] bg-paper ${className ?? ''}`}
			style={{ aspectRatio }}
			initial={reduced ? false : { opacity: 0.92, y: 6 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-6% 0px' }}
			transition={{
				duration: reduced ? duration.reducedCrossfade : duration.image,
				ease: ease.reveal,
			}}
		>
			{media}
		</m.div>
	);
}
