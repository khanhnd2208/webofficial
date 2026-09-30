'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';

export default function CreateCourseForm() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [slug, setSlug] = useState('');
	const [summary, setSummary] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const data = await adminFetch<{ id: string }>('/api/admin/courses', {
				method: 'POST',
				body: JSON.stringify({
					title,
					slug: slug.trim() || undefined,
					summary,
				}),
			});
			router.push(`${routes.admin.courses}/${data.id}`);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
			setSaving(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4">
			{error ? (
				<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			) : null}
			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Tiêu đề</span>
				<input
					required
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">
					Slug (tuỳ chọn)
				</span>
				<input
					value={slug}
					onChange={(e) => setSlug(e.target.value)}
					placeholder="tu-dong-tu-tieu-de"
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">Tóm tắt</span>
				<textarea
					value={summary}
					onChange={(e) => setSummary(e.target.value)}
					rows={3}
					className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<button
				type="submit"
				disabled={saving}
				className="rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
			>
				{saving ? 'Đang tạo…' : 'Tạo khóa học'}
			</button>
		</form>
	);
}
