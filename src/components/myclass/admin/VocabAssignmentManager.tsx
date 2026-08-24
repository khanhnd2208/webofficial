'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import type { MyClassVocabSetCard } from '@/features/my-class';
import VocabSetEditor, { toCreateWords, useVocabSetDraft } from '@/components/vocab/VocabSetEditor';
import VocabImportDialog from '@/components/myclass/workspace/edit/VocabImportDialog';
import { myClassApi } from './api';

type SearchHit = { id: string; title: string; wordCount: number; isArchived: boolean };

export default function VocabAssignmentManager({
	courseId,
	courseTitle = '',
	lessons,
	initial,
}: {
	courseId: string;
	courseTitle?: string;
	lessons: Array<{ id: string; title: string }>;
	initial: MyClassVocabSetCard[];
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [importLessonId, setImportLessonId] = useState<string | null>(null);
	const [mode, setMode] = useState<'attach' | 'create'>('attach');
	const [q, setQ] = useState('');
	const [scope, setScope] = useState('');
	const [results, setResults] = useState<SearchHit[]>([]);
	const [error, setError] = useState<string | null>(null);
	const draft = useVocabSetDraft({ title: '' });

	useEffect(() => {
		if (!open || mode !== 'attach') return;
		void search(q);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, mode]);

	async function search(query = q) {
		const items = await myClassApi<
			Array<{ id: string; title: string; _count?: { words: number }; wordCount?: number; isArchived: boolean }>
		>(`/api/admin/my-class/courses/${courseId}/vocab-assignments?q=${encodeURIComponent(query)}`);
		setResults(
			items.map((item) => ({
				id: item.id,
				title: item.title,
				wordCount: item.wordCount ?? item._count?.words ?? 0,
				isArchived: item.isArchived,
			})),
		);
	}

	async function assign(vocabSetId: string) {
		setError(null);
		try {
			await myClassApi(`/api/admin/my-class/courses/${courseId}/vocab-assignments`, {
				method: 'POST',
				body: JSON.stringify({ vocabSetId, lessonId: scope || null }),
			});
			setOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không gắn được');
		}
	}

	async function createAndAssign() {
		const words = toCreateWords(draft.words);
		if (!draft.title.trim()) {
			setError('Nhập tên bộ từ');
			return;
		}
		if (!words.length) {
			setError('Cần ít nhất một từ có nghĩa');
			return;
		}
		setError(null);
		try {
			await myClassApi('/api/admin/my-class/vocab-sets', {
				method: 'POST',
				body: JSON.stringify({
					title: draft.title.trim(),
					description: draft.description.trim(),
					words,
					courseId,
					lessonId: scope || null,
				}),
			});
			setOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được bộ từ');
		}
	}

	async function move(assignmentId: string, lessonId: string | null) {
		await myClassApi(`/api/admin/my-class/courses/${courseId}/vocab-assignments/${assignmentId}`, {
			method: 'PATCH',
			body: JSON.stringify({ lessonId }),
		});
		router.refresh();
	}

	const courseSets = initial.filter((item) => item.scope === 'course');
	const lessonSets = initial.filter((item) => item.scope === 'lesson');

	return (
		<div className="space-y-6">
			<div className="flex justify-end gap-2">
				<Link
					href={routes.admin.myClassVocabulary}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
				>
					Thư viện từ vựng
				</Link>
				<button
					type="button"
					onClick={() => {
						setImportLessonId(scope || null);
						setImportOpen(true);
					}}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
				>
					Nhập CSV
				</button>
				<button
					type="button"
					onClick={() => {
						setMode('attach');
						setOpen(true);
					}}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
				>
					Gắn bộ từ
				</button>
			</div>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<section>
				<h2 className="font-bold">Toàn khóa</h2>
				<SetList
					courseId={courseId}
					lessons={lessons}
					items={courseSets}
					onMove={move}
					onRefresh={() => router.refresh()}
				/>
			</section>
			{lessons.map((lesson) => (
				<section key={lesson.id}>
					<h2 className="font-bold">{lesson.title}</h2>
					<SetList
						courseId={courseId}
						lessons={lessons}
						items={lessonSets.filter((item) => item.lessonId === lesson.id)}
						onMove={move}
						onRefresh={() => router.refresh()}
					/>
				</section>
			))}
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				title={mode === 'create' ? 'Tạo và gắn bộ từ' : 'Gắn bộ từ vựng'}
			>
				<div className="space-y-3">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setMode('attach')}
							className={`min-h-11 rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold ${mode === 'attach' ? 'bg-ink text-paper' : 'border border-mc-rule'}`}
						>
							Gắn có sẵn
						</button>
						<button
							type="button"
							onClick={() => setMode('create')}
							className={`min-h-11 rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold ${mode === 'create' ? 'bg-ink text-paper' : 'border border-mc-rule'}`}
						>
							Tạo bộ mới
						</button>
					</div>
					<select
						value={scope}
						onChange={(event) => setScope(event.target.value)}
						className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					>
						<option value="">Toàn khóa</option>
						{lessons.map((lesson) => (
							<option key={lesson.id} value={lesson.id}>
								{lesson.title}
							</option>
						))}
					</select>
					{mode === 'attach' ? (
						<>
							<input
								value={q}
								onChange={(event) => {
									setQ(event.target.value);
									void search(event.target.value);
								}}
								placeholder="Tìm bộ từ"
								className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
							/>
							<ul className="max-h-56 space-y-2 overflow-auto text-sm">
								{results.map((item) => (
									<li key={item.id} className="flex justify-between gap-2">
										<span>
											{item.title} · {item.wordCount} từ
										</span>
										<button type="button" onClick={() => void assign(item.id)} className="min-h-11 underline">
											Gắn
										</button>
									</li>
								))}
							</ul>
						</>
					) : (
						<VocabSetEditor
							title={draft.title}
							description={draft.description}
							words={draft.words}
							onTitleChange={draft.setTitle}
							onDescriptionChange={draft.setDescription}
							onWordsChange={draft.setWords}
						/>
					)}
					{mode === 'create' ? (
						<button
							type="button"
							onClick={() => void createAndAssign()}
							className="min-h-11 w-full rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
						>
							Tạo và gắn
						</button>
					) : null}
				</div>
			</Dialog>
			<VocabImportDialog
				standalone={{
					courseId,
					courseTitle,
					lessonId: importLessonId,
					lessonTitle: lessons.find((lesson) => lesson.id === importLessonId)?.title ?? null,
					open: importOpen,
					onClose: () => setImportOpen(false),
					onImported: () => router.refresh(),
				}}
			/>
		</div>
	);
}

function SetList({
	courseId,
	lessons,
	items,
	onMove,
	onRefresh,
}: {
	courseId: string;
	lessons: Array<{ id: string; title: string }>;
	items: MyClassVocabSetCard[];
	onMove: (assignmentId: string, lessonId: string | null) => Promise<void>;
	onRefresh: () => void;
}) {
	if (!items.length) return <p className="mt-2 text-sm text-muted">Chưa gắn bộ từ.</p>;
	return (
		<ul className="mt-2 divide-y divide-mc-rule border border-mc-rule">
			{items.map((item) => (
				<li key={item.assignmentId} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
					<div>
						<p className="font-medium">{item.title}</p>
						<p className="text-xs text-muted">
							{item.wordCount} từ
							{item.isArchived ? ' · đã lưu trữ' : ''}
							{item.wordCount === 0 ? ' · rỗng' : ''}
							{!item.guessWhoReady ? ' · thiếu Guess Who' : ''}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<select
							aria-label="Chuyển phạm vi"
							value={item.lessonId ?? ''}
							onChange={(event) => void onMove(item.assignmentId, event.target.value || null)}
							className="min-h-11 rounded-[var(--mc-r-sm)] border border-mc-rule px-2 text-xs"
						>
							<option value="">Toàn khóa</option>
							{lessons.map((lesson) => (
								<option key={lesson.id} value={lesson.id}>
									{lesson.title}
								</option>
							))}
						</select>
						<Link href={routes.admin.myClassVocabularyEdit(item.vocabSetId)} className="min-h-11 underline">
							Sửa
						</Link>
						<button
							type="button"
							onClick={() =>
								void myClassApi(
									`/api/admin/my-class/courses/${courseId}/vocab-assignments/${item.assignmentId}`,
									{ method: 'DELETE' },
								).then(onRefresh)
							}
							className="min-h-11 underline"
						>
							Gỡ
						</button>
					</div>
				</li>
			))}
		</ul>
	);
}
