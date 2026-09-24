'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminFetch } from '@/lib/admin/client';

import { LearnIcon } from './LearnIcon';

async function celebrate() {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const { default: confetti } = await import('canvas-confetti');
	void confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, disableForReducedMotion: true });
}

export default function LearnCompleteButton({
	sectionId,
	completed,
	nextHref,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	completed: boolean;
	nextHref: string | null;
	/** True when this is the only section left: completing it finishes the course. */
	finishesCourse?: boolean;
	overviewHref?: string;
}) {
	const router = useRouter();
	const [done, setDone] = useState(completed);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	async function save(value: boolean, goNext: boolean) {
		setError(null);
		setDone(value);
		try {
			await adminFetch(`/api/learn/sections/${sectionId}/progress`, {
				method: 'PATCH',
				body: JSON.stringify({ completed: value }),
			});
			const finished = value && finishesCourse;
			if (finished) void celebrate();
			startTransition(() => {
				if (finished && overviewHref) router.push(overviewHref);
				else if (goNext && nextHref) router.push(nextHref);
				else router.refresh();
			});
		} catch (err) {
			setDone(!value);
			setError(err instanceof Error ? err.message : 'Không lưu được');
		}
	}

	return (
		<div className="ln-complete">
			{done ? (
				<button
					type="button"
					className="ln-btn ln-btn--done"
					onClick={() => save(false, false)}
					disabled={pending}
					title="Bấm để bỏ đánh dấu"
				>
					<LearnIcon name="checkCircle" size={16} /> Đã hoàn thành
				</button>
			) : (
				<button type="button" className="ln-btn ln-btn--primary" onClick={() => save(true, true)} disabled={pending}>
					<LearnIcon name="check" size={15} strokeWidth={2.4} />
					{finishesCourse ? 'Hoàn thành khóa học' : nextHref ? 'Hoàn thành & tiếp tục' : 'Đánh dấu hoàn thành'}
				</button>
			)}
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
