'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminFetch } from '@/lib/admin/client';

export default function LearnCompleteButton({
	sectionId,
	completed,
	nextHref,
}: {
	sectionId: string;
	completed: boolean;
	nextHref: string | null;
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
			startTransition(() => {
				if (goNext && nextHref) router.push(nextHref);
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
				<button type="button" className="ln-btn ln-btn--done" onClick={() => save(false, false)} disabled={pending}>
					<span aria-hidden="true">✓</span> Đã hoàn thành
				</button>
			) : (
				<button type="button" className="ln-btn ln-btn--primary" onClick={() => save(true, true)} disabled={pending}>
					{nextHref ? 'Hoàn thành, sang mục tiếp' : 'Đánh dấu hoàn thành'}
				</button>
			)}
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
