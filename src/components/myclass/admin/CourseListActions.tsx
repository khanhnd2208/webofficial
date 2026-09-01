'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { myClassApi } from '@/components/myclass/admin/api';
import { routes } from '@/config/routes';

export default function CourseListActions({
	courseId,
	courseSlug,
}: {
	courseId: string;
	courseSlug: string;
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function archive() {
		const ok = await confirm({
			title: 'Lưu trữ khóa học?',
			description: 'Khóa học sẽ biến mất khỏi trang học viên.',
			confirmLabel: 'Lưu trữ',
		});
		if (!ok) return;
		setBusy(true);
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/courses/${courseId}`, { method: 'DELETE' });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu trữ được');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<Link
				href={routes.myClassCourseEdit(courseSlug)}
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] bg-ink px-3 text-xs font-semibold text-paper"
			>
				Sửa
			</Link>
			<Link
				href={routes.admin.myClassCourseContent(courseId)}
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-xs font-semibold text-ink hover:bg-surface-sunken"
			>
				Studio
			</Link>
			<button
				type="button"
				disabled={busy}
				className="inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-xs font-semibold text-ink-secondary hover:bg-surface-sunken disabled:opacity-60"
				onClick={() => void archive()}
			>
				Lưu trữ
			</button>
			{error ? <p className="basis-full text-right text-xs text-error">{error}</p> : null}
			{dialog}
		</div>
	);
}
