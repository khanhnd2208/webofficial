'use client';

import { useState } from 'react';

import QuestionNav from './QuestionNav';
import type { Reveal } from './types';

interface MobileQuizBarProps {
	total: number;
	currentIndex: number;
	answeredCount: number;
	correctCount: number;
	reveals: Record<string, Reveal>;
	questionIds: string[];
	answered: boolean;
	onJump: (index: number) => void;
}

export default function MobileQuizBar({
	total,
	currentIndex,
	answeredCount,
	correctCount,
	reveals,
	questionIds,
	answered,
	onJump,
}: MobileQuizBarProps) {
	const [open, setOpen] = useState(false);
	const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

	return (
		<div className="sticky top-[var(--header-height)] z-20 -mx-[var(--gutter)] mb-4 border-b border-hairline bg-canvas/95 px-[var(--gutter)] py-3 backdrop-blur-sm lg:hidden">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="font-sans text-sm text-ink">
					<span className="font-semibold">
						Câu {currentIndex + 1}/{total}
					</span>
					<span className="text-ink-secondary">
						{' '}
						· {correctCount}/{answeredCount || 0} đúng
					</span>
				</p>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-hairline bg-paper/60 px-3 font-sans text-sm font-medium text-ink"
					aria-expanded={open}
					aria-controls="myspace-quiz-mobile-nav"
				>
					{open ? 'Đóng danh sách' : 'Danh sách câu'}
				</button>
			</div>

			<div
				className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-hairline"
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Phần trăm hoàn thành"
			>
				<div
					className="h-full rounded-full bg-ink transition-[width] duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>

			{open ? (
				<div id="myspace-quiz-mobile-nav" className="mt-4 pb-1">
					<QuestionNav
						total={total}
						currentIndex={currentIndex}
						reveals={reveals}
						questionIds={questionIds}
						answered={answered}
						onJump={(i) => {
							onJump(i);
							setOpen(false);
						}}
						compact
					/>
				</div>
			) : null}
		</div>
	);
}
