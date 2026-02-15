'use client';

import { useState } from 'react';

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiRes<T> = ApiOk<T> | ApiErr;

type CourseDTO = { id: string; name: string; description: string };

export default function CreateCourseInline() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<'idle' | 'creating' | 'error'>('idle');
	const [error, setError] = useState('');

	async function onCreate() {
		const trimmed = name.trim();
		if (!trimmed) return;
		setStatus('creating');
		setError('');
		try {
			const res = await fetch('/api/admin/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed, description: description.trim() }),
			});
			const json = (await res.json()) as ApiRes<unknown>;
			if (!res.ok || !json.ok) throw new Error(!json.ok ? json.error : `HTTP ${res.status}`);
			const course = json.data as CourseDTO;
			if (!course?.id) throw new Error('Missing course id');
			setName('');
			setDescription('');
			window.location.href = `/admin/learning?courseId=${encodeURIComponent(course.id)}`;
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	return (
		<div className="rounded-lg border border-border p-3">
			<div className="text-xs font-medium text-foreground-secondary">Tạo course</div>
			<div className="mt-2 grid gap-2">
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Course name"
					className="w-full rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
					onKeyDown={(e) => {
						if (e.key === 'Enter') void onCreate();
					}}
				/>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Mô tả ngắn (tuỳ chọn)"
					rows={2}
					className="w-full resize-none rounded-md border border-border-hover bg-background px-3 py-2 text-sm"
				/>
				<button
					type="button"
					onClick={() => void onCreate()}
					disabled={status === 'creating' || !name.trim()}
					className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
				>
					{status === 'creating' ? 'Đang tạo…' : 'Tạo course'}
				</button>
			</div>
			{status === 'error' ? <p className="mt-2 text-xs text-error">{error}</p> : null}
		</div>
	);
}
