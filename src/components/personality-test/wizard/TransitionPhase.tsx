'use client';

/* ════════════════════════════════════════════════════════════════════════
   TransitionPhase — Celebration screen between BFI and SD3 sections
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { TransitionPhaseProps } from './types';

export default function TransitionPhase({
	config,
	totalBfiAnswered,
	onContinue,
}: TransitionPhaseProps) {
	return (
		<motion.div
			key="transition"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="rounded-2xl border border-border bg-surface p-8 sm:p-10"
		>
			<div className="text-center">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success-subtle text-3xl"
				>
					🎉
				</motion.div>
				<h3 className="mt-5 text-xl font-black text-foreground">
					Awesome! Part 1 Complete
				</h3>
				<p className="mt-1 text-sm font-semibold text-success">
					✅ {totalBfiAnswered}/{config.bfiQuestions.length} items — Big Five (OCEAN) done
				</p>
			</div>

			<div className="mt-6 rounded-xl border border-rose/20 bg-rose-subtle/30 p-5">
				<div className="flex items-center gap-3">
					<span className="text-2xl">🌑</span>
					<div>
						<h4 className="font-bold text-foreground">Up next: Dark Triad</h4>
						<p className="text-xs text-muted">28 items • SD3 (Short Dark Triad)</p>
					</div>
				</div>
				<p className="mt-3 text-xs leading-relaxed text-muted">
					This part explores strategic thinking, self-confidence, and risk tolerance.
					No right or wrong answers — just keep going with your honest reactions!
				</p>
			</div>

			<div className="mt-4 text-center">
				<p className="text-xs text-muted mb-4">{config.sd3Questions.length} more items — about 5 minutes 💪</p>
				<button
					onClick={onContinue}
					className="rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
				>
					Ready — Let&apos;s go! →
				</button>
			</div>
		</motion.div>
	);
}
