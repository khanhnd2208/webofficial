'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { myClassApi } from '@/components/myclass/admin/api';
import VocabSetEditor, { toCreateWords, useVocabSetDraft } from '@/components/vocab/VocabSetEditor';
import { routes } from '@/config/routes';

export default function NewVocabSetPage() {
	const router = useRouter();
	const draft = useVocabSetDraft({ title: 'Bộ từ mới' });
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		const words = toCreateWords(draft.words);
		if (!draft.title.trim()) {
			setError('Nhập tên bộ từ');
			return;
		}
		if (!words.length) {
			setError('Cần ít nhất một từ có nghĩa');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const created = await myClassApi<{ set: { id: string } }>('/api/admin/my-class/vocab-sets', {
				method: 'POST',
				body: JSON.stringify({
					title: draft.title.trim(),
					description: draft.description.trim(),
					words,
				}),
			});
			router.push(routes.admin.myClassVocabularyEdit(created.set!.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được bộ từ');
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassVocabulary}
				className="text-xs uppercase tracking-widest text-muted"
			>
				← Thư viện từ vựng
			</Link>
			<h1 className="mt-6 text-2xl font-black">Tạo bộ từ vựng</h1>
			<form onSubmit={(event) => void submit(event)} className="mt-8 space-y-6">
				<VocabSetEditor
					title={draft.title}
					description={draft.description}
					words={draft.words}
					onTitleChange={draft.setTitle}
					onDescriptionChange={draft.setDescription}
					onWordsChange={draft.setWords}
					error={error}
				/>
				<button
					disabled={busy}
					className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-5 text-sm font-semibold text-paper disabled:opacity-40"
				>
					{busy ? 'Đang tạo…' : 'Tạo bộ từ'}
				</button>
			</form>
		</div>
	);
}
