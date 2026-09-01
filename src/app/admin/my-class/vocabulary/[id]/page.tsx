'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { myClassApi } from '@/components/myclass/admin/api';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import VocabSetEditor, { toCreateWords, useLoadedVocabSet } from '@/components/vocab/VocabSetEditor';
import { routes } from '@/config/routes';

export default function EditVocabSetPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const draft = useLoadedVocabSet(params.id);
	const { confirm, dialog } = useAdminConfirm();
	const [busy, setBusy] = useState(false);

	async function save(event: React.FormEvent) {
		event.preventDefault();
		const words = toCreateWords(draft.words);
		if (!draft.title.trim()) {
			draft.setError('Nhập tên bộ từ');
			return;
		}
		if (!words.length) {
			draft.setError('Cần ít nhất một từ có nghĩa');
			return;
		}
		setBusy(true);
		draft.setError(null);
		try {
			const deleteWordIds = draft.words.filter((word) => word._deleted && word.id).map((word) => word.id!);
			await myClassApi(`/api/admin/my-class/vocab-sets/${params.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					title: draft.title.trim(),
					description: draft.description.trim(),
					words: draft.words
						.filter((word) => !word._deleted)
						.map((word) => ({
							...(word.id ? { id: word.id } : {}),
							...toCreateWords([word])[0],
						})),
					deleteWordIds,
				}),
			});
			router.refresh();
			draft.setError(null);
			setBusy(false);
		} catch (err) {
			draft.setError(err instanceof Error ? err.message : 'Không lưu được');
			setBusy(false);
		}
	}

	return (
		<>
		<div className="mc-studio-container px-0 py-8">
			<Link href={routes.admin.myClassVocabulary} className="text-xs uppercase tracking-widest text-muted">
				← Thư viện từ vựng
			</Link>
			<h1 className="mt-6 text-2xl font-black">Sửa bộ từ vựng</h1>
			{draft.loading ? <p className="mt-8 text-sm text-ink-secondary">Đang tải…</p> : null}
			{!draft.loading ? (
				<form onSubmit={(event) => void save(event)} className="mt-8 space-y-6">
					<VocabSetEditor
						title={draft.title}
						description={draft.description}
						words={draft.words}
						onTitleChange={draft.setTitle}
						onDescriptionChange={draft.setDescription}
						onWordsChange={draft.setWords}
						error={draft.error}
					/>
					<div className="flex flex-wrap gap-3">
						<button
							disabled={busy}
							className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-5 text-sm font-semibold text-paper disabled:opacity-40"
						>
							{busy ? 'Đang lưu…' : 'Lưu bộ từ'}
						</button>
						<button
							type="button"
							disabled={busy}
							className="min-h-11 rounded-[var(--mc-r-sm)] border border-error/40 px-5 text-sm font-semibold text-error disabled:opacity-40"
							onClick={async () => {
								const ok = await confirm({
									title: 'Lưu trữ bộ từ',
									description: 'Lưu trữ bộ từ này? Học viên sẽ không thấy bộ từ ở khóa học.',
									confirmLabel: 'Lưu trữ',
								});
								if (!ok) return;
								setBusy(true);
								draft.setError(null);
								try {
									await myClassApi(`/api/admin/my-class/vocab-sets/${params.id}`, { method: 'DELETE' });
									router.push(routes.admin.myClassVocabulary);
								} catch (err) {
									draft.setError(err instanceof Error ? err.message : 'Không lưu trữ được');
									setBusy(false);
								}
							}}
						>
							Lưu trữ
						</button>
					</div>
				</form>
			) : null}
		</div>
		{dialog}
		</>
	);
}
