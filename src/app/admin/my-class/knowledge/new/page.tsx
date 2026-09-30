'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { myClassApi } from '@/components/myclass/admin/api';
import { routes } from '@/config/routes';

export default function NewKnowledgePage() {
	const router = useRouter();
	const [title, setTitle] = useState('Đơn vị kiến thức mới');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const unit = await myClassApi<{ id: string }>('/api/admin/my-class/knowledge', {
				method: 'POST',
				body: JSON.stringify({ title }),
			});
			router.push(routes.admin.myClassKnowledgeEdit(unit.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được đơn vị kiến thức');
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassKnowledge}
				className="text-xs uppercase tracking-widest text-muted"
			>
				← Thư viện nội dung
			</Link>
			<h1 className="mt-6 text-2xl font-black">Tạo đơn vị kiến thức</h1>
			<form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
				{error ? <p className="text-sm text-error">{error}</p> : null}
				<label className="block text-sm">
					Tiêu đề
					<input
						required
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className="mt-1 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2"
					/>
				</label>
				<button
					disabled={busy}
					className="rounded-[var(--mc-r-sm)] bg-ink px-5 py-2 text-xs font-bold uppercase text-paper disabled:opacity-40"
				>
					{busy ? 'Đang tạo…' : 'Tạo bản nháp'}
				</button>
			</form>
		</div>
	);
}
