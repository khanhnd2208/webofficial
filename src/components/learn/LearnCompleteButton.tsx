'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminFetch } from '@/lib/admin/client';

import { celebrate } from './celebrate';

export default function LearnCompleteButton({
	sectionId,
	completed,
	nextHref,
	nextTitle,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	completed: boolean;
	nextHref: string | null;
	nextTitle?: string | null;
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

	const primaryLabel = finishesCourse ? 'Hoàn thành khóa học' : 'Hoàn thành & tiếp →';

	return (
		<div className="ln-complete">
			{done ? (
				<>
					{nextHref ? (
						<Link href={nextHref} className="ln-btn ln-btn--primary" data-ln-primary="">
							Tiếp: {nextTitle ?? 'mục sau'} →
						</Link>
					) : overviewHref ? (
						<Link href={overviewHref} className="ln-btn ln-btn--primary" data-ln-primary="">
							Về trang khóa học
						</Link>
					) : null}
					<button
						type="button"
						className="ln-link-btn"
						onClick={() => save(false, false)}
						disabled={pending}
					>
						Bỏ đánh dấu
					</button>
				</>
			) : (
				<button
					type="button"
					className="ln-btn ln-btn--primary"
					data-ln-primary=""
					onClick={() => save(true, true)}
					disabled={pending}
					title="Hoàn thành và sang mục tiếp (→)"
				>
					{primaryLabel}
				</button>
			)}
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
