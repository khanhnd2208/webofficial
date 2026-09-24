'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { routes } from '@/config/routes';
import type { LearnCourseMeta } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

export default function NewCourseButton() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function create(event: React.FormEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		setBusy(true);
		setError(null);
		try {
			const course = await adminFetch<LearnCourseMeta>('/api/admin/learn/courses', {
				method: 'POST',
				body: JSON.stringify({ title }),
			});
			router.push(routes.learnStudio(course.slug));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được khóa học');
			setBusy(false);
		}
	}

	if (!open) {
		return (
			<button type="button" className="ln-btn ln-btn--primary" onClick={() => setOpen(true)}>
				Tạo khóa học
			</button>
		);
	}

	return (
		<form onSubmit={create} className="flex w-full max-w-md flex-col gap-2 sm:w-auto">
			<div className="flex gap-2">
				<input
					autoFocus
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
					placeholder="Tên khóa học"
					className="ln-input min-w-0 flex-1"
					maxLength={200}
					disabled={busy}
				/>
				<button type="submit" className="ln-btn ln-btn--primary" disabled={busy || !title.trim()}>
					{busy ? 'Đang tạo…' : 'Tạo'}
				</button>
			</div>
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</form>
	);
}
