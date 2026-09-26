'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminFetch } from '@/lib/admin/client';

import { celebrate } from './celebrate';
import LearnLinkPending, { LearnPendingMark } from './LearnLinkPending';

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
	const [saving, setSaving] = useState(false);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const busy = saving || pending;

	async function save(value: boolean, goNext: boolean) {
		const finished = value && finishesCourse;
		const target = finished && overviewHref ? overviewHref : goNext ? nextHref : null;
		setError(null);
		// Leaving the section: keep this button (busy) until the next page replaces it, rather
		// than flipping to a "Tiếp" link that looks clickable while the save is in flight.
		if (target) setSaving(true);
		else setDone(value);
		try {
			await adminFetch(`/api/learn/sections/${sectionId}/progress`, {
				method: 'PATCH',
				body: JSON.stringify({ completed: value }),
			});
			if (finished) void celebrate();
			startTransition(() => {
				setDone(value);
				if (target) router.push(target);
			});
		} catch (err) {
			if (!target) setDone(!value);
			setError(err instanceof Error ? err.message : 'Không lưu được');
		} finally {
			setSaving(false);
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
							<LearnLinkPending />
						</Link>
					) : overviewHref ? (
						<Link href={overviewHref} className="ln-btn ln-btn--primary" data-ln-primary="">
							Về trang khóa học
							<LearnLinkPending />
						</Link>
					) : null}
					<button
						type="button"
						className="ln-link-btn"
						onClick={() => save(false, false)}
						disabled={busy}
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
					disabled={busy}
					aria-busy={busy || undefined}
					title="Hoàn thành và sang mục tiếp (→)"
				>
					{saving ? 'Đang lưu…' : pending ? 'Đang mở…' : primaryLabel}
					<LearnPendingMark pending={busy} />
				</button>
			)}
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
