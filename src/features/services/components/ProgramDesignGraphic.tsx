'use client';

import { m, useReducedMotion } from 'framer-motion';

import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';
import { programDesign } from '@/content/services';

/**
 * Single method infographic: 3 questions → suitable content / form / scope.
 */
export function ProgramDesignGraphic() {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	return (
		<section
			className="shell border-b border-hairline py-14 md:py-20"
			aria-labelledby="program-design-title"
		>
			<p className="editorial-label">{programDesign.eyebrow}</p>
			<h2
				id="program-design-title"
				className="mt-4 max-w-[28ch] font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.02em] text-ink"
			>
				{programDesign.title}
			</h2>
			<p className="mt-4 max-w-[var(--measure)] text-base leading-[1.7] text-ink-secondary">
				{programDesign.lead}
			</p>

			<StaggerGroup className="mt-10 grid gap-0 border border-hairline md:grid-cols-3">
				{programDesign.questions.map((q, index) => (
					<StaggerItem
						key={q.id}
						className={`relative border-hairline bg-paper/50 p-6 md:p-7 ${
							index < programDesign.questions.length - 1 ? 'border-b md:border-r md:border-b-0' : ''
						}`}
					>
						{index < programDesign.questions.length - 1 ? (
							<span
								className="absolute -bottom-3 left-1/2 z-10 hidden -translate-x-1/2 bg-canvas px-1 font-display text-lg text-accent md:bottom-auto md:top-1/2 md:-right-3 md:left-auto md:translate-x-0 md:-translate-y-1/2"
								aria-hidden
							>
								+
							</span>
						) : null}
						<p className="font-mono text-xs tracking-[0.12em] text-ink/40">
							{String(index + 1).padStart(2, '0')}
						</p>
						<h3 className="mt-3 font-display text-lg font-medium tracking-[-0.01em] text-ink md:text-xl">
							{q.label}
						</h3>
						<p className="mt-3 text-sm leading-[1.65] text-ink-secondary">{q.body}</p>
					</StaggerItem>
				))}
			</StaggerGroup>

			<div className="mt-8 flex flex-col items-center gap-3 text-center">
				<m.span
					aria-hidden
					className="text-ink-secondary"
					initial={instant ? false : { opacity: 1, y: -6 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: instant ? 0 : duration.ui, ease: ease.reveal }}
				>
					↓
				</m.span>
				<m.div
					className="w-full max-w-xl border border-ink/15 bg-accent-subtle px-5 py-4"
					initial={instant ? false : { opacity: 1, y: 8 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{
						duration: instant ? 0 : duration.section,
						delay: instant ? 0 : 0.1,
						ease: ease.reveal,
					}}
				>
					<p className="text-sm text-ink-secondary">{programDesign.formula}</p>
					<p className="mt-2 font-display text-base font-medium tracking-[-0.01em] text-ink md:text-lg">
						{programDesign.output}
					</p>
				</m.div>
				<p className="mt-2 max-w-[var(--measure)] text-sm leading-[1.65] text-ink-secondary">
					{programDesign.note}
				</p>
			</div>
		</section>
	);
}
