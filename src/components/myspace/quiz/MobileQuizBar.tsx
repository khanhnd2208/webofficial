'use client';

import Link from 'next/link';
import { useState } from 'react';

import { routes } from '@/config/routes';

import QuestionNav from './QuestionNav';
import type { Reveal } from './types';

interface MobileQuizBarProps {
	title: string;
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
	title,
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
		<div className="sticky top-0 z-20 -mx-[var(--gutter)] mb-4 border-b border-hairline bg-canvas/95 px-[var(--gutter)] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-sm lg:hidden">
			<div className="flex items-center gap-3">
				<Link
					href={routes.mySpaceTests}
					className="inline-flex min-h-11 shrink-0 items-center font-sans text-sm text-ink-secondary transition-colors hover:text-ink"
					aria-label="Về Tests"
					data-testid="myspace-quiz-back"
				>
					← Tests
				</Link>
				<p className="min-w-0 flex-1 truncate font-display text-sm font-medium tracking-tight text-ink">
					{title}
				</p>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-sm)] border border-hairline bg-paper/60 px-3 font-sans text-sm font-medium text-ink"
					aria-expanded={open}
					aria-controls="myspace-quiz-mobile-nav"
				>
					{open ? 'Đóng' : 'Danh sách'}
				</button>
			</div>

			<div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
				<p className="font-sans text-sm text-ink">
					<span className="font-semibold">
						Câu {currentIndex + 1}/{total}
					</span>
					{answeredCount > 0 ? (
						<span className="text-ink-secondary">
							{' '}
							· {correctCount}/{answeredCount} đúng
						</span>
					) : null}
				</p>
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
