'use client';

import type { QuestionNavStatus, Reveal } from './types';

interface QuestionNavProps {
	total: number;
	currentIndex: number;
	reveals: Record<string, Reveal>;
	questionIds: string[];
	answered: boolean;
	onJump: (index: number) => void;
	compact?: boolean;
}

function statusFor(
	i: number,
	currentIndex: number,
	reveal: Reveal | undefined,
	answered: boolean,
): QuestionNavStatus {
	if (reveal) return reveal.isCorrect ? 'correct' : 'wrong';
	if (i === currentIndex) return 'current';
	const canReach = i <= currentIndex || (i === currentIndex + 1 && answered);
	if (!canReach) return 'locked';
	return 'pending';
}

function cellClass(status: QuestionNavStatus): string {
	switch (status) {
		case 'correct':
			return 'bg-success text-canvas border-success';
		case 'wrong':
			return 'bg-error text-canvas border-error';
		case 'current':
			return 'bg-canvas text-ink border-ink ring-2 ring-ink/15';
		case 'locked':
			return 'bg-paper text-ink-secondary border-hairline cursor-not-allowed';
		default:
			return 'bg-canvas text-ink border-hairline hover:border-ink/40';
	}
}

function statusLabel(status: QuestionNavStatus, n: number): string {
	switch (status) {
		case 'correct':
			return `Question ${n}, correct`;
		case 'wrong':
			return `Question ${n}, incorrect`;
		case 'current':
			return `Question ${n}, current`;
		case 'locked':
			return `Question ${n}, locked`;
		default:
			return `Question ${n}`;
	}
}

export default function QuestionNav({
	total,
	currentIndex,
	reveals,
	questionIds,
	answered,
	onJump,
	compact = false,
}: QuestionNavProps) {
	return (
		<div data-testid="myspace-quiz-nav">
			<div
				className={`grid gap-2 ${compact ? 'grid-cols-6 sm:grid-cols-8' : 'grid-cols-5'}`}
				role="group"
				aria-label="Question list"
			>
				{Array.from({ length: total }, (_, i) => {
					const qId = questionIds[i];
					const reveal = qId ? reveals[qId] : undefined;
					const status = statusFor(i, currentIndex, reveal, answered);
					const canJump =
						Boolean(reveal) ||
						i === currentIndex ||
						i <= currentIndex ||
						(i === currentIndex + 1 && answered);
					const locked = status === 'locked' || !canJump;

					return (
						<button
							key={qId ?? i}
							type="button"
							disabled={locked}
							title={locked ? 'Not available yet' : undefined}
							aria-label={statusLabel(status, i + 1)}
							aria-current={i === currentIndex ? 'step' : undefined}
							aria-disabled={locked}
							onClick={() => onJump(i)}
							className={`flex h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border font-mono text-[0.8125rem] font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${cellClass(status)}`}
							data-testid={`myspace-progress-${i + 1}`}
						>
							{i + 1}
						</button>
					);
				})}
			</div>
		</div>
	);
}
