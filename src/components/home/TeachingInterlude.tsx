'use client';

import Link from 'next/link';
import { m, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { routes } from '@/config/routes';

const STEPS = [
	{ label: 'Khóa học', detail: 'Lộ trình chọn lọc' },
	{ label: 'Chương', detail: 'Cấu trúc như mục lục' },
	{ label: 'Bài học', detail: 'Tiến bộ có dấu vết' },
] as const;

/**
 * Teaching Interlude — espresso scene.
 * Vermilion thought-line draws through steps and becomes the CTA underline.
 */
export default function TeachingInterlude() {
	const ref = useRef<HTMLElement>(null);
	const { allowsReveal, reduced } = useMotionTier();
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ['start 75%', 'end 35%'],
	});
	const pathLength = useTransform(scrollYProgress, [0, 0.75], [0, 1]);
	const underlineScale = useTransform(scrollYProgress, [0.55, 0.9], [0, 1]);

	return (
		<section ref={ref} className="bg-[#161410] text-[#F2ECE1] dark:bg-[#0c0b09]">
			<div className="shell py-[var(--section-space)]">
				<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B7AFA2]">Giảng dạy</p>
				<h2 className="mt-4 max-w-2xl font-display type-section font-medium text-[#F2ECE1]">
					Học có lộ trình.
					<br />
					Tiến bộ có dấu vết.
				</h2>

				<div className="relative mt-14 max-w-2xl">
					<svg
						className="pointer-events-none absolute left-[11px] top-3 h-[calc(100%-0.5rem)] w-4 overflow-visible"
						aria-hidden
					>
						{!allowsReveal || reduced ? (
							<line x1="2" y1="0" x2="2" y2="100%" stroke="var(--vermilion)" strokeWidth="1.5" />
						) : (
							<m.line
								x1="2"
								y1="0"
								x2="2"
								y2="100%"
								stroke="var(--vermilion)"
								strokeWidth="1.5"
								style={{ pathLength }}
							/>
						)}
					</svg>

					<ol className="space-y-10">
						{STEPS.map((step, i) => (
							<li key={step.label} className="relative flex gap-6 pl-1">
								<span
									className="relative z-[1] mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border border-vermilion bg-[#161410]"
									aria-hidden
								>
									<span className="absolute inset-[5px] rounded-full bg-vermilion" />
								</span>
								<div>
									<p className="font-mono text-[10px] text-vermilion">
										{String(i + 1).padStart(2, '0')}
									</p>
									<p className="mt-1 font-display text-2xl font-medium">{step.label}</p>
									<p className="mt-1 text-sm text-[#B7AFA2]">{step.detail}</p>
								</div>
							</li>
						))}
					</ol>
				</div>

				<div className="mt-14">
					<Link
						href={routes.teaching}
						className="group relative inline-flex items-center gap-3 pb-1 text-sm font-semibold tracking-wide text-[#F2ECE1] transition duration-200"
					>
						Khám phá giảng dạy
						<span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
							→
						</span>
						{/* Thought-line becomes CTA underline */}
						{allowsReveal && !reduced ? (
							<m.span
								aria-hidden
								className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-vermilion"
								style={{ scaleX: underlineScale }}
							/>
						) : (
							<span aria-hidden className="absolute inset-x-0 bottom-0 h-[1.5px] bg-vermilion" />
						)}
					</Link>
				</div>
			</div>
		</section>
	);
}
