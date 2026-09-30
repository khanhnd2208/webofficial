'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { myClassApi, myClassList } from '@/components/myclass/admin/api';
import { McSheet } from '@/components/myclass/ui';
import { routes } from '@/config/routes';
import {
	attachTargetLabel,
	formatPlacementLabel,
	isTestAttachedAt,
} from '@/features/my-class/domain/attachTarget';
import { useEditMode, type AttachTarget } from './EditModeContext';

type TestPlacement = {
	scope?: 'COURSE' | 'LESSON' | 'SECTION';
	course?: { id: string; title?: string };
	lesson?: { id: string; title?: string } | null;
	section?: { id: string; title?: string } | null;
};

type TestHit = {
	id: string;
	title: string;
	slug: string;
	status?: string;
	_count?: { questions: number; placements: number };
	placements?: TestPlacement[];
};

type VocabHit = {
	id: string;
	title: string;
	_count?: { words: number };
	myClassAssignments?: Array<{
		id: string;
		lessonId: string | null;
		lesson: { id: string; title: string } | null;
	}>;
};

type KuHit = { id: string; title: string };

export default function AttachPicker() {
	const edit = useEditMode();
	if (!edit?.picker) return null;
	const target = edit.picker;
	return (
		<AttachPickerBody
			key={`${target.kind}:${target.lessonId ?? ''}:${target.sectionId ?? ''}:${target.scope ?? ''}`}
			target={target}
			courseId={edit.courseId}
			course={edit.course}
			onClose={() => edit.setPicker(null)}
			onToast={edit.setToast}
			onChooseTest={(id) => edit.attachTest(id, target)}
			onChooseVocab={(id) => edit.attachVocab(id, target.lessonId ?? null)}
			onChooseUnit={(id) =>
				target.sectionId ? edit.attachExistingUnit(target.sectionId, id) : Promise.resolve(false)
			}
		/>
	);
}

function AttachPickerBody({
	target,
	courseId,
	course,
	onClose,
	onToast,
	onChooseTest,
	onChooseVocab,
	onChooseUnit,
}: {
	target: AttachTarget;
	courseId: string;
	course: {
		title: string;
		lessons: Array<{ id: string; title: string; sections: Array<{ id: string; title: string }> }>;
	};
	onClose: () => void;
	onToast: (value: string) => void;
	onChooseTest: (id: string) => Promise<boolean>;
	onChooseVocab: (id: string) => Promise<boolean>;
	onChooseUnit: (id: string) => Promise<boolean>;
}) {
	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [tests, setTests] = useState<TestHit[]>([]);
	const [vocab, setVocab] = useState<VocabHit[]>([]);
	const [units, setUnits] = useState<KuHit[]>([]);
	const [busy, setBusy] = useState(true);

	useEffect(() => {
		const delay = query.trim() ? 250 : 0;
		const timer = window.setTimeout(() => setDebouncedQuery(query), delay);
		return () => window.clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setBusy(true);
			try {
				const q = debouncedQuery.trim();
				if (target.kind === 'test') {
					const params = new URLSearchParams({ picker: '1' });
					if (q) params.set('q', q);
					const rows = await myClassList<TestHit>(`/api/admin/my-class/tests?${params.toString()}`);
					if (!cancelled) setTests(rows.filter((row) => row.status !== 'ARCHIVED'));
				} else if (target.kind === 'vocab') {
					const rows = await myClassApi<VocabHit[]>(
						`/api/admin/my-class/courses/${courseId}/vocab-assignments?q=${encodeURIComponent(q)}`,
					);
					if (!cancelled) setVocab(rows);
				} else {
					const rows = await myClassList<KuHit>(
						`/api/admin/my-class/knowledge?q=${encodeURIComponent(q)}&pageSize=50`,
					);
					if (!cancelled) setUnits(rows);
				}
			} catch (err) {
				if (!cancelled) onToast(err instanceof Error ? err.message : 'Không tải được');
			} finally {
				if (!cancelled) setBusy(false);
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [courseId, debouncedQuery, onToast, target.kind]);

	const title =
		target.kind === 'test'
			? 'Gắn bài kiểm tra'
			: target.kind === 'vocab'
				? 'Gắn bộ từ vựng'
				: 'Gắn nội dung có sẵn';
	const destination = useMemo(() => attachTargetLabel(course, target), [course, target]);

	async function choose(id: string) {
		const attached =
			target.kind === 'test'
				? await onChooseTest(id)
				: target.kind === 'vocab'
					? await onChooseVocab(id)
					: await onChooseUnit(id);
		if (attached) onClose();
	}

	return (
		<McSheet open onClose={onClose} title={title} side="right">
			<div className="space-y-4">
				<p className="mc-meta" data-testid="attach-picker-target">
					Gắn vào: {destination}
				</p>
				<label className="block text-sm">
					<span className="sr-only">Tìm</span>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên…"
						className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
				</label>
				{busy ? <p className="mc-meta">Đang tải…</p> : null}
				<ul className="space-y-1">
					{target.kind === 'test'
						? tests.map((item) => {
								const questions = item._count?.questions ?? 0;
								const attachedHere = isTestAttachedAt(item.placements ?? [], courseId, target);
								const empty = questions === 0;
								const disabled = attachedHere || empty;
								const otherLabels = (item.placements ?? [])
									.filter((placement) => placement.course?.id === courseId)
									.filter((placement) => !isTestAttachedAt([placement], courseId, target))
									.map(formatPlacementLabel);
								const reason = attachedHere
									? 'Đã gắn ở đây'
									: empty
										? 'Chưa có câu hỏi'
										: otherLabels.length
											? `Đã gắn: ${otherLabels.join(', ')}`
											: `${questions} câu`;
								return (
									<li key={item.id}>
										<button
											type="button"
											disabled={disabled}
											className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--mc-r-sm)] px-3 text-left text-sm hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-60"
											onClick={() => void choose(item.id)}
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate">{item.title}</span>
												<span className="mc-meta block">
													{item.status && item.status !== 'PUBLISHED'
														? `${statusLabel(item.status)} · `
														: ''}
													{reason}
												</span>
											</span>
											<Link
												href={routes.admin.myClassTestEdit(item.id)}
												className="shrink-0 text-xs text-ink-secondary hover:text-ink"
												onClick={(event) => event.stopPropagation()}
											>
												Sửa trong studio
											</Link>
										</button>
									</li>
								);
							})
						: target.kind === 'vocab'
							? vocab.map((item) => {
									const wordCount = item._count?.words ?? 0;
									const assignments = item.myClassAssignments ?? [];
									const attachedHere = assignments.some(
										(row) => (row.lessonId ?? null) === (target.lessonId ?? null),
									);
									const otherLabels = assignments
										.filter((row) => (row.lessonId ?? null) !== (target.lessonId ?? null))
										.map((row) => row.lesson?.title ?? 'Toàn khóa');
									const reason = attachedHere
										? 'Đã gắn ở đây'
										: otherLabels.length
											? `Đang dùng ở: ${otherLabels.join(', ')}`
											: `${wordCount} từ`;
									return (
										<li key={item.id}>
											<button
												type="button"
												disabled={attachedHere}
												className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--mc-r-sm)] px-3 text-left text-sm hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-60"
												onClick={() => void choose(item.id)}
											>
												<span className="min-w-0 flex-1">
													<span className="block truncate">{item.title}</span>
													<span className="mc-meta block">{reason}</span>
												</span>
											</button>
										</li>
									);
								})
							: units.map((item) => (
									<li key={item.id}>
										<button
											type="button"
											className="flex min-h-11 w-full items-center justify-between rounded-[var(--mc-r-sm)] px-3 text-left text-sm hover:bg-surface-sunken"
											onClick={() => void choose(item.id)}
										>
											<span>{item.title}</span>
										</button>
									</li>
								))}
					{!busy &&
					((target.kind === 'test' && tests.length === 0) ||
						(target.kind === 'vocab' && vocab.length === 0) ||
						(target.kind === 'knowledge' && units.length === 0)) ? (
						<li className="mc-meta px-3">Không có mục phù hợp.</li>
					) : null}
				</ul>
				{target.kind === 'test' ? (
					<Link
						href={routes.admin.myClassTestNew}
						className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--mc-r-sm)] border border-mc-rule text-sm font-semibold"
					>
						Tạo bài trong thư viện
					</Link>
				) : null}
				{target.kind === 'vocab' ? (
					<Link
						href={routes.admin.myClassVocabularyNew}
						className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--mc-r-sm)] border border-mc-rule text-sm font-semibold"
					>
						Tạo bộ trong thư viện
					</Link>
				) : null}
			</div>
		</McSheet>
	);
}

function statusLabel(status: string) {
	if (status === 'DRAFT') return 'Nháp';
	if (status === 'ARCHIVED') return 'Lưu trữ';
	return status;
}
