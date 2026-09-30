'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { myClassApi } from './api';

export default function PublishCourseButton({ courseId }: { courseId: string }) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	async function publish() {
		setBusy(true);
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/courses/${courseId}/publish`, { method: 'POST' });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không xuất bản được');
		} finally {
			setBusy(false);
		}
	}
	return (
		<div>
			<button
				type="button"
				disabled={busy}
				onClick={() => void publish()}
				className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
			>
				Xuất bản
			</button>
			{error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
		</div>
	);
}
