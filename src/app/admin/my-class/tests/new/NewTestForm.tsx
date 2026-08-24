'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/config/routes';
import { myClassApi } from '@/components/myclass/admin/api';
import { StudioButton, StudioField, StudioInput } from '@/components/myclass/admin/studio';

export default function NewTestForm() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [error, setError] = useState<string | null>(null);
	async function submit(event: React.FormEvent) {
		event.preventDefault();
		try {
			const created = await myClassApi<{ id: string }>('/api/admin/my-class/tests', {
				method: 'POST',
				body: JSON.stringify({ title }),
			});
			router.push(routes.admin.myClassTestEdit(created.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được');
		}
	}
	return (
		<form onSubmit={submit} className="mt-8 space-y-4">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<StudioField label="Tên bài kiểm tra">
				<StudioInput required value={title} onChange={(event) => setTitle(event.target.value)} />
			</StudioField>
			<StudioButton type="submit">Tạo bài kiểm tra</StudioButton>
		</form>
	);
}
