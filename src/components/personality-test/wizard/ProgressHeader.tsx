'use client';

/* ════════════════════════════════════════════════════════════════════════
   ProgressHeader — Sticky top bar showing phase, timer, and progress
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { TestPhase } from './types';
import { formatTime } from './helpers';

interface Props {
	phase: TestPhase;
	elapsed: number;
	totalAnswered: number;
	totalQuestions: number;
}

const PHASE_LABELS: Record<TestPhase, string> = {
	intro: '',
	demographics: '👤 About You',
	bfi: '🌟 Part 1: Big Five Personality',
	sd3: '🌑 Part 2: Dark Triad',
	transition: '🎉 Great job!',
	review: '🎊 Almost done!',
};

export default function ProgressHeader({ phase, elapsed, totalAnswered, totalQuestions }: Props) {
	const progressPercent = totalQuestions > 0
		? Math.round((totalAnswered / totalQuestions) * 100)
		: 0;

	return (
		<div className="sticky top-0 z-10 mb-6 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur-md">
			<div className="flex items-center justify-between text-sm">
				<span className="font-bold text-foreground">
					{PHASE_LABELS[phase]}
				</span>
				<div className="flex items-center gap-3">
					<span className="text-xs text-muted tabular-nums">⏱ {formatTime(elapsed)}</span>
					<span className="text-xs font-bold text-accent tabular-nums">
						{totalAnswered}/{totalQuestions}
					</span>
				</div>
			</div>
			<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-secondary">
				<motion.div
					className="h-full rounded-full bg-accent"
					initial={{ width: 0 }}
					animate={{ width: `${progressPercent}%` }}
					transition={{ duration: 0.3 }}
				/>
			</div>
		</div>
	);
}
