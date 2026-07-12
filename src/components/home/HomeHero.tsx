'use client';

import Link from 'next/link';
import { m, useScroll } from 'framer-motion';
import { useRef } from 'react';

import AmbientLight from '@/components/motion/AmbientLight';
import HeroWordmark from '@/components/motion/HeroWordmark';
import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease, heroTimeline } from '@/components/motion/tokens';

type HomeHeroProps = {
	roleLabel?: string;
	primaryCta: { href: string; label: string };
	secondaryCta: { href: string; label: string };
	featuredImage?: { src: string; alt: string } | null;
};

export default function HomeHero({ roleLabel, primaryCta, secondaryCta, featuredImage }: HomeHeroProps) {
	const { allowsReveal, allowsAmbient, reduced } = useMotionTier();
	const sectionRef = useRef<HTMLElement>(null);

	// Containing block = hero section — avoids Framer scroll-offset warnings
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ['start start', 'end start'],
	});

	return (
		<section
			ref={sectionRef}
			className="relative h-[min(88svh,820px)] max-h-[920px] overflow-hidden border-b border-hairline max-md:h-[min(84svh,720px)] lg:h-[min(92svh,920px)]"
		>
			{allowsAmbient ? <AmbientLight /> : null}

			<div className="shell relative flex h-full flex-col justify-center gap-8 py-8 sm:py-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-12">
				<div className="lg:col-span-7">
					<HeroWordmark scrollProgress={scrollYProgress} />

					{roleLabel ? (
						<m.p
							initial={allowsReveal && !reduced ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={{
								duration: reduced ? duration.reducedCrossfade : duration.section,
								ease: ease.reveal,
								delay: allowsReveal ? heroTimeline.wordmark + 0.05 : 0,
							}}
							className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary"
						>
							{roleLabel}
						</m.p>
					) : null}

					{/* Manifesto — visible immediately; optional soft enhance */}
					<m.div
						initial={allowsReveal && !reduced ? { opacity: 0.85, y: 8 } : false}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduced ? duration.reducedCrossfade : duration.section,
							ease: ease.reveal,
							delay: allowsReveal ? heroTimeline.manifesto : 0,
						}}
						className="mt-5 max-w-xl sm:mt-7"
					>
						<p className="font-display text-[1.35rem] font-medium leading-snug text-ink sm:text-3xl lg:text-[2.15rem]">
							Viết để hiểu sâu.
							<br />
							Dạy để cùng tiến xa.
						</p>
						<p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-secondary sm:mt-5 sm:text-lg">
							Góc nhìn chọn lọc về viết và học — cùng khóa học được thiết kế riêng cho học viên được mời.
						</p>
					</m.div>

					<m.div
						initial={allowsReveal && !reduced ? { opacity: 0.85, y: 6 } : false}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduced ? duration.reducedCrossfade : duration.section,
							ease: ease.reveal,
							delay: allowsReveal ? heroTimeline.cta : 0,
						}}
						className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
					>
						<Link
							href={primaryCta.href}
							className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-200 hover:bg-ink/90"
						>
							{primaryCta.label}
						</Link>
						<Link
							href={secondaryCta.href}
							className="inline-flex min-h-11 items-center rounded-[10px] border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-200 hover:border-ink"
						>
							{secondaryCta.label}
						</Link>
					</m.div>
				</div>

				{featuredImage ? (
					<m.div
						className="relative hidden lg:col-span-5 lg:block"
						initial={allowsReveal ? { opacity: 0.9, scale: 1.02 } : false}
						animate={{ opacity: 1, scale: 1 }}
						transition={{
							duration: allowsReveal ? duration.image : duration.reducedCrossfade,
							ease: ease.reveal,
							delay: allowsReveal ? heroTimeline.image : 0,
						}}
					>
						<div className="overflow-hidden rounded-[18px] bg-paper">
							<img
								src={featuredImage.src}
								alt={featuredImage.alt}
								width={800}
								height={1000}
								className="aspect-[4/5] w-full object-cover"
								fetchPriority="high"
								decoding="async"
							/>
						</div>
					</m.div>
				) : (
					<div className="hidden lg:col-span-5 lg:block" aria-hidden>
						<div className="rounded-[18px] border border-hairline bg-paper/60 p-10">
							<p className="font-display text-4xl font-medium leading-tight text-ink/40">
								Bài viết
								<br />&amp; Giảng dạy
							</p>
						</div>
					</div>
				)}
			</div>

			{allowsReveal ? (
				<p
					aria-hidden
					className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-secondary/60 sm:block"
				>
					Cuộn
				</p>
			) : null}
		</section>
	);
}
