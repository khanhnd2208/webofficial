'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { StudioButton, StudioField, StudioInput } from '@/components/myclass/admin/studio';
import { teachingApi } from '@/components/teaching/admin/api';
import type { TeachingTutorialRecord } from '@/features/teaching/types';

export function SessionsWorkspace({
	classId,
	tutorials,
}: {
	classId: string;
	tutorials: TeachingTutorialRecord[];
}) {
	const router = useRouter();
	const [code, setCode] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	async function addTutorial(event: React.FormEvent) {
		event.preventDefault();
		setError('');
		try {
			await teachingApi(`/api/admin/teaching/classes/${classId}/tutorials`, {
				method: 'POST',
				body: JSON.stringify({ code, name: name || code }),
			});
			setCode('');
			setName('');
			router.refresh();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Không thể thêm tutorial');
		}
	}

	return (
		<div className="mc-surface space-y-4 p-4">
			<div>
				<h2 className="text-sm font-semibold text-ink">Tutorial</h2>
				<p className="mt-1 text-xs text-ink-secondary">
					Quản lý nhóm tutorial. Ngày và trạng thái buổi được thao tác trực tiếp trên bảng Điểm
					danh.
				</p>
			</div>
			<form className="flex flex-wrap items-end gap-3" onSubmit={addTutorial}>
				<StudioField label="Mã tutorial" className="min-w-36">
					<StudioInput
						required
						value={code}
						onChange={(event) => setCode(event.target.value)}
						placeholder="T01"
					/>
				</StudioField>
				<StudioField label="Tên tutorial" className="min-w-52">
					<StudioInput
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Nhóm 01"
					/>
				</StudioField>
				<StudioButton type="submit">Thêm tutorial</StudioButton>
			</form>
			{error ? (
				<p className="text-xs font-medium text-error" role="alert">
					{error}
				</p>
			) : null}
			<div className="flex flex-wrap gap-2">
				{tutorials.map((tutorial) => (
					<span key={tutorial.id} className="mc-chip">
						{tutorial.code} · {tutorial.name}
					</span>
				))}
				{tutorials.length === 0 ? (
					<span className="text-sm text-ink-secondary">Chưa có tutorial.</span>
				) : null}
			</div>
		</div>
	);
}
