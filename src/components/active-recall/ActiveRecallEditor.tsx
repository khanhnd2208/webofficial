'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';
import type {
	ActiveRecallDeckDTO,
	ActiveRecallStatus,
	RecallImportPreview,
} from '@/features/active-recall';
import { routes } from '@/config/routes';

type EditorCard = { id?: string; localId: string; question: string; answer: string };

const emptyCard = (): EditorCard => ({ localId: crypto.randomUUID(), question: '', answer: '' });

function csv(rows: EditorCard[]) {
	const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
	return `\uFEFFid,question,answer,order\r\n${rows.map((row, index) => [row.id ?? '', row.question, row.answer, index].map(quote).join(',')).join('\r\n')}\r\n`;
}

function qaText(rows: EditorCard[]) {
	return rows.map((row) => `Q: ${row.question}\nA: ${row.answer}`).join('\n---\n');
}

function download(filename: string, text: string) {
	const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function deckCards(deck: ActiveRecallDeckDTO | null): EditorCard[] {
	return (
		deck?.cards.map((card) => ({
			id: card.id,
			localId: card.id,
			question: card.question,
			answer: card.answer,
		})) ?? []
	);
}

export default function ActiveRecallEditor({
	initialDeck,
}: {
	initialDeck: ActiveRecallDeckDTO | null;
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [deck, setDeck] = useState(initialDeck);
	const [title, setTitle] = useState(initialDeck?.title ?? '');
	const [slug, setSlug] = useState(initialDeck?.slug ?? '');
	const [subject, setSubject] = useState(initialDeck?.subject ?? '');
	const [lessonLabel, setLessonLabel] = useState(initialDeck?.lessonLabel ?? '');
	const [description, setDescription] = useState(initialDeck?.description ?? '');
	const [status, setStatus] = useState<ActiveRecallStatus>(initialDeck?.status ?? 'DRAFT');
	const [cards, setCards] = useState<EditorCard[]>(() => deckCards(initialDeck));
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [importText, setImportText] = useState('');
	const [preview, setPreview] = useState<RecallImportPreview | null>(null);
	const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [undoCard, setUndoCard] = useState<EditorCard | null>(null);
	const initialRef = useRef('');

	const snapshot = useMemo(
		() =>
			JSON.stringify({
				title,
				slug,
				subject,
				lessonLabel,
				description,
				status,
				cards: cards.map(({ id, question, answer }) => ({ id, question, answer })),
			}),
		[cards, description, lessonLabel, slug, status, subject, title],
	);
	useEffect(() => {
		initialRef.current = initialRef.current || snapshot;
	}, [snapshot]);
	const dirty = snapshot !== initialRef.current;

	function updateCard(localId: string, patch: Partial<EditorCard>) {
		setCards((items) =>
			items.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
		);
	}
	function moveCard(index: number, destination: number) {
		if (destination < 0 || destination >= cards.length || destination === index) return;
		setCards((items) => {
			const next = [...items];
			const [item] = next.splice(index, 1);
			next.splice(destination, 0, item!);
			return next;
		});
	}
	function removeCard(localId: string) {
		const item = cards.find((card) => card.localId === localId);
		if (!item) return;
		setCards((items) => items.filter((card) => card.localId !== localId));
		setUndoCard(item);
		setNotice('Đã bỏ thẻ. Nhấn Hoàn tác để đưa lại trước khi lưu.');
		window.setTimeout(() => setNotice(null), 7000);
	}

	async function createDeck() {
		if (!title.trim()) {
			setError('Hãy nhập tên bộ thẻ');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const created = await adminFetch<ActiveRecallDeckDTO>('/api/admin/active-recall', {
				method: 'POST',
				body: JSON.stringify({
					title,
					slug: slug || undefined,
					subject,
					lessonLabel,
					description,
					status: 'DRAFT',
				}),
			});
			router.replace(routes.admin.activeRecallEdit(created.id));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không tạo được bộ thẻ');
		} finally {
			setBusy(false);
		}
	}

	async function saveDeck() {
		if (!deck) return createDeck();
		if (cards.some((card) => !card.question.trim() || !card.answer.trim())) {
			setError('Mỗi thẻ cần đủ câu hỏi và đáp án');
			return;
		}
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const saved = await adminFetch<ActiveRecallDeckDTO>(`/api/admin/active-recall/${deck.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					title,
					slug: slug || undefined,
					subject,
					lessonLabel,
					description,
					status,
					expectedUpdatedAt: deck.updatedAt,
					cards: cards.map((card) => ({
						id: card.id,
						question: card.question,
						answer: card.answer,
					})),
				}),
			});
			setDeck(saved);
			setCards(deckCards(saved));
			setTitle(saved.title);
			setSlug(saved.slug);
			setSubject(saved.subject);
			setLessonLabel(saved.lessonLabel);
			setDescription(saved.description);
			setStatus(saved.status);
			initialRef.current = JSON.stringify({
				title: saved.title,
				slug: saved.slug,
				subject: saved.subject,
				lessonLabel: saved.lessonLabel,
				description: saved.description,
				status: saved.status,
				cards: deckCards(saved).map(({ id, question, answer }) => ({ id, question, answer })),
			});
			setNotice('Đã lưu thay đổi.');
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không lưu được bộ thẻ');
		} finally {
			setBusy(false);
		}
	}

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				void saveDeck();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	async function runPreview() {
		if (!deck || !importText.trim()) return;
		setBusy(true);
		setError(null);
		setPreview(null);
		try {
			setPreview(
				await adminFetch<RecallImportPreview>(
					`/api/admin/active-recall/${deck.id}/import?dryRun=1&mode=${importMode}`,
					{
						method: 'POST',
						body: JSON.stringify({ text: importText, mode: importMode }),
					},
				),
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không đọc được dữ liệu');
		} finally {
			setBusy(false);
		}
	}

	async function commitImport(mode: 'append' | 'replace') {
		if (!deck || !preview || preview.summary.invalid) return;
		if (
			mode === 'replace' &&
			!(await confirm({
				title: 'Thay thế thẻ',
				description: 'Thay thế sẽ xóa các thẻ hiện có không nằm trong file import. Tiếp tục?',
				confirmLabel: 'Thay thế',
			}))
		)
			return;
		setBusy(true);
		setError(null);
		try {
			const imported = await adminFetch<{ deck: ActiveRecallDeckDTO }>(
				`/api/admin/active-recall/${deck.id}/import`,
				{
					method: 'POST',
					body: JSON.stringify({ text: importText, mode, expectedUpdatedAt: deck.updatedAt }),
				},
			);
			setDeck(imported.deck);
			setCards(deckCards(imported.deck));
			setPreview(null);
			setImportText('');
			setNotice('Đã import dữ liệu.');
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không import được dữ liệu');
		} finally {
			setBusy(false);
		}
	}

	async function archive() {
		if (
			!deck ||
			!(await confirm({
				title: 'Lưu trữ bộ thẻ',
				description: 'Lưu trữ bộ thẻ này? Học viên sẽ không còn thấy nó.',
				confirmLabel: 'Lưu trữ',
			}))
		)
			return;
		setBusy(true);
		setError(null);
		try {
			await adminFetch(`/api/admin/active-recall/${deck.id}`, { method: 'DELETE' });
			router.push(routes.admin.activeRecall);
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể lưu trữ bộ thẻ');
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
		<div className="mx-auto max-w-[88rem] px-6 py-8">
			<div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">
						Công cụ · Active Recall
					</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
						{deck ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ'}
					</h1>
					<p className="mt-2 text-sm text-muted">
						Dán Q/A hoặc CSV, xem trước rồi lưu. Phím tắt: Cmd/Ctrl+S.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						href={routes.admin.activeRecall}
						className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
					>
						Danh sách
					</Link>
					{deck ? (
						<button
							type="button"
							onClick={() => void archive()}
							className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
							disabled={busy}
						>
							Lưu trữ
						</button>
					) : null}
					<button
						type="button"
						onClick={() => void saveDeck()}
						className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-50"
						disabled={busy}
					>
						{busy ? 'Đang lưu…' : deck ? 'Lưu thay đổi' : 'Tạo bộ thẻ'}
					</button>
				</div>
			</div>
			{error ? (
				<p role="alert" className="mt-4 text-sm text-red-700">
					{error}
				</p>
			) : null}
			{notice ? (
				<div className="mt-4 flex items-center gap-3 text-sm text-emerald-700">
					<span>{notice}</span>
					{undoCard ? (
						<button
							type="button"
							className="font-semibold underline"
							onClick={() => {
								setCards((items) => [...items, undoCard]);
								setUndoCard(null);
								setNotice(null);
							}}
						>
							Hoàn tác
						</button>
					) : null}
				</div>
			) : null}

			<section className="mt-7 grid gap-4 border border-border bg-surface p-5 md:grid-cols-2">
				<label className="text-sm font-semibold">
					Tên bộ thẻ
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
						placeholder="HRM · Lesson 1"
					/>
				</label>
				<label className="text-sm font-semibold">
					Đường dẫn{' '}
					{deck?.status !== 'DRAFT' ? (
						<span className="font-normal text-muted">(đã khóa sau xuất bản)</span>
					) : null}
					<input
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
						disabled={Boolean(deck && deck.status !== 'DRAFT')}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal disabled:opacity-60"
						placeholder="hrm-lesson-1"
					/>
				</label>
				<label className="text-sm font-semibold">
					Môn học
					<input
						value={subject}
						onChange={(event) => setSubject(event.target.value)}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
						placeholder="Human Resource Management"
					/>
				</label>
				<label className="text-sm font-semibold">
					Nhãn bài
					<input
						value={lessonLabel}
						onChange={(event) => setLessonLabel(event.target.value)}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
						placeholder="Lesson 1"
					/>
				</label>
				<label className="text-sm font-semibold md:col-span-2">
					Mô tả
					<textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						rows={2}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
					/>
				</label>
				<label className="text-sm font-semibold">
					Trạng thái
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value as ActiveRecallStatus)}
						className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
					>
						<option value="DRAFT">Bản nháp</option>
						<option value="PUBLISHED">Công khai</option>
						<option value="ARCHIVED">Lưu trữ</option>
					</select>
				</label>
			</section>

			{deck ? (
				<section className="mt-7 border border-border bg-surface p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="font-bold text-foreground">Import / export</h2>
							<p className="mt-1 text-sm text-muted">
								Dán Q:/A:, Question:/Answer:, Câu hỏi:/Đáp án: hoặc CSV có cột question,answer.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
								onClick={() => download(`${deck.slug}.csv`, csv(cards))}
							>
								Xuất CSV
							</button>
							<button
								type="button"
								className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
								onClick={() =>
									void navigator.clipboard
										.writeText(qaText(cards))
										.then(() => setNotice('Đã sao chép dạng Q/A.'))
								}
							>
								Sao chép Q/A
							</button>
						</div>
					</div>
					<textarea
						value={importText}
						onChange={(event) => {
							setImportText(event.target.value);
							setPreview(null);
						}}
						rows={8}
						className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
						placeholder={'Q: What is HRM?\nA: ...\n---\nQ: ...\nA: ...'}
					/>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<select
							value={importMode}
							onChange={(event) => {
								setImportMode(event.target.value as 'append' | 'replace');
								setPreview(null);
							}}
							className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="append">Thêm vào bộ hiện có</option>
							<option value="replace">Thay thế toàn bộ thẻ</option>
						</select>
						<button
							type="button"
							onClick={() => void runPreview()}
							disabled={!importText.trim() || busy}
							className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-50"
						>
							Kiểm tra dữ liệu
						</button>
						{preview && preview.summary.invalid === 0 ? (
							<button
								type="button"
								onClick={() => void commitImport(importMode)}
								disabled={busy}
								className={`rounded-lg border px-4 py-2 text-sm font-semibold ${importMode === 'replace' ? 'border-red-200 text-red-700' : 'border-border'}`}
							>
								{importMode === 'replace'
									? 'Thay thế bằng dữ liệu này'
									: `Thêm ${preview.summary.valid} thẻ`}
							</button>
						) : null}
					</div>
					{preview ? (
						<div className="mt-4 text-sm">
							<p>
								<strong>{preview.summary.valid}</strong> hợp lệ ·{' '}
								<strong>{preview.summary.invalid}</strong> lỗi ·{' '}
								<strong>{preview.summary.duplicates}</strong> trùng
								{preview.summary.orphanAnswers
									? ` · ${preview.summary.orphanAnswers} đáp án thiếu câu hỏi`
									: ''}
							</p>
							<ul className="mt-2 list-disc pl-5 text-red-700">
								{preview.rows
									.filter((row) => row.errors.length)
									.slice(0, 8)
									.map((row) => (
										<li key={row.row}>
											Dòng {row.row}: {row.errors.join(', ')}
										</li>
									))}
							</ul>
						</div>
					) : null}
				</section>
			) : null}

			<section className="mt-7">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-black text-foreground">
							Thẻ <span className="text-muted">{cards.length}</span>
						</h2>
						<p className="mt-1 text-sm text-muted">
							Kéo để sắp thứ tự, hoặc dùng mũi tên. Mỗi thẻ luôn có một câu hỏi và một đáp án.
						</p>
					</div>
					<button
						type="button"
						className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
						onClick={() => setCards((items) => [...items, emptyCard()])}
					>
						+ Thêm thẻ
					</button>
				</div>
				<div className="mt-4 space-y-3">
					{cards.map((card, index) => (
						<article
							key={card.localId}
							draggable
							onDragStart={() => setDragIndex(index)}
							onDragOver={(event) => event.preventDefault()}
							onDrop={() => {
								if (dragIndex !== null) moveCard(dragIndex, index);
								setDragIndex(null);
							}}
							className="grid gap-3 border border-border bg-surface p-4 lg:grid-cols-[2.4rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
						>
							<div className="flex items-start gap-1 pt-1 text-sm text-muted">
								<span className="cursor-grab select-none">⠿</span>
								<span className="tabular-nums">{index + 1}</span>
							</div>
							<label className="text-xs font-bold uppercase tracking-wide text-muted">
								Câu hỏi
								<textarea
									value={card.question}
									onChange={(event) => updateCard(card.localId, { question: event.target.value })}
									rows={4}
									className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
								/>
							</label>
							<label className="text-xs font-bold uppercase tracking-wide text-muted">
								Đáp án
								<textarea
									value={card.answer}
									onChange={(event) => updateCard(card.localId, { answer: event.target.value })}
									rows={4}
									className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
								/>
							</label>
							<div className="flex items-start gap-1">
								<button
									type="button"
									onClick={() => moveCard(index, index - 1)}
									disabled={index === 0}
									className="rounded p-2 text-sm hover:bg-background disabled:opacity-30"
									aria-label="Di chuyển lên"
								>
									↑
								</button>
								<button
									type="button"
									onClick={() => moveCard(index, index + 1)}
									disabled={index === cards.length - 1}
									className="rounded p-2 text-sm hover:bg-background disabled:opacity-30"
									aria-label="Di chuyển xuống"
								>
									↓
								</button>
								<button
									type="button"
									onClick={() =>
										setCards((items) => [
											...items.slice(0, index + 1),
											{ ...card, id: undefined, localId: crypto.randomUUID() },
											...items.slice(index + 1),
										])
									}
									className="rounded p-2 text-sm hover:bg-background"
									aria-label="Nhân bản thẻ"
								>
									⧉
								</button>
								<button
									type="button"
									onClick={() => removeCard(card.localId)}
									className="rounded p-2 text-sm text-red-700 hover:bg-red-50"
									aria-label="Xóa thẻ"
								>
									×
								</button>
							</div>
						</article>
					))}
				</div>
			</section>
			{dirty ? (
				<div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-lg">
					<span className="text-sm font-semibold">Bạn có thay đổi chưa lưu.</span>
					<button
						type="button"
						onClick={() => void saveDeck()}
						className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background"
					>
						Lưu thay đổi
					</button>
				</div>
			) : null}
		</div>
		{dialog}
		</>
	);
}
