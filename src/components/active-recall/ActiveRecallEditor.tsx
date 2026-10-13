'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLeaveGuard } from '@/components/ui/useLeaveGuard';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';
import type {
	ActiveRecallDeckDTO,
	ActiveRecallStatus,
	RecallImportPreview,
} from '@/features/active-recall';
import { recallHasContent } from '@/features/active-recall/richText';
import { routes } from '@/config/routes';

import RecallCardLanguageTabs from './RecallCardLanguageTabs';
import RecallBulkImport from './RecallBulkImport';
import { deckCards, deckSnapshot, emptyCard, type EditorCard } from './editorState';
import { ACTIVE_RECALL_MAX_CARDS } from '@/features/active-recall/schemas';

export default function ActiveRecallEditor({
	initialDeck,
	courseId,
	courseName,
}: {
	initialDeck: ActiveRecallDeckDTO | null;
	courseId?: string;
	courseName?: string;
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [deck, setDeck] = useState(initialDeck);
	const [title, setTitle] = useState(initialDeck?.title ?? '');
	const [slug, setSlug] = useState(initialDeck?.slug ?? '');
	const resolvedCourseId = courseId ?? initialDeck?.courseId ?? '';
	const [subject, setSubject] = useState(
		courseName ?? initialDeck?.courseName ?? initialDeck?.subject ?? '',
	);
	const listHref = resolvedCourseId
		? routes.mySpaceTeachingCourseTab(resolvedCourseId, 'recall')
		: routes.admin.activeRecall;
	const deckApiPath = (deckId: string) =>
		resolvedCourseId
			? `/api/admin/teaching/courses/${resolvedCourseId}/recall/${deckId}`
			: `/api/admin/active-recall/${deckId}`;
	const [lessonLabel, setLessonLabel] = useState(initialDeck?.lessonLabel ?? '');
	const [description, setDescription] = useState(initialDeck?.description ?? '');
	const [status, setStatus] = useState<ActiveRecallStatus>(initialDeck?.status ?? 'DRAFT');
	const [cards, setCards] = useState<EditorCard[]>(() => {
		const existing = deckCards(initialDeck);
		return existing.length ? existing : [emptyCard()];
	});
	const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(!initialDeck || initialDeck.cards.length === 0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [importText, setImportText] = useState('');
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [undoCard, setUndoCard] = useState<{ card: EditorCard; index: number } | null>(null);
	const [fileLoading, setFileLoading] = useState(false);
	const initialRef = useRef('');
	const savingRef = useRef(false);

	function beginWrite() {
		if (savingRef.current) return false;
		savingRef.current = true;
		setBusy(true);
		setError(null);
		return true;
	}

	function endWrite() {
		savingRef.current = false;
		setBusy(false);
	}

	const snapshot = useMemo(
		() =>
			JSON.stringify({
				title,
				slug,
				subject,
				lessonLabel,
				description,
				status,
				cards: cards.map(({ id, question, answer, questionVi, answerVi }) => ({
					id,
					question,
					answer,
					questionVi,
					answerVi,
				})),
			}),
		[cards, description, lessonLabel, slug, status, subject, title],
	);
	useEffect(() => {
		initialRef.current = initialRef.current || snapshot;
	}, [snapshot]);
	const dirty = Boolean(initialRef.current) && snapshot !== initialRef.current;

	function updateCard(localId: string, patch: Partial<EditorCard>) {
		if (savingRef.current) return;
		setUndoImport(null);
		setCards((items) =>
			items.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
		);
	}
	function moveCard(index: number, destination: number) {
		if (destination < 0 || destination >= cards.length || destination === index) return;
		setUndoImport(null);
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
		setUndoImport(null);
		setUndoCard({ card: item, index: cards.indexOf(item) });
		setNotice('Đã bỏ thẻ. Nhấn Hoàn tác để đưa lại trước khi lưu.');
	}

	function cardsForSave() {
		const nextErrors: Record<string, string> = {};
		const valid: EditorCard[] = [];
		for (const card of cards) {
			const hasQuestion = recallHasContent(card.question);
			const hasAnswer = recallHasContent(card.answer);
			if (
				!hasQuestion &&
				!hasAnswer &&
				!recallHasContent(card.questionVi) &&
				!recallHasContent(card.answerVi)
			)
				continue;
			if (!hasQuestion) nextErrors[card.localId] = 'Thẻ thiếu câu hỏi';
			else if (!hasAnswer) nextErrors[card.localId] = 'Thẻ thiếu đáp án';
			else valid.push(card);
		}
		setCardErrors(nextErrors);
		const firstError = cards.findIndex((card) => nextErrors[card.localId]);
		if (firstError >= 0) setCardPage(Math.floor(firstError / 20));
		return { valid, invalid: Object.keys(nextErrors).length > 0 };
	}

	function checkPendingImport() {
		if (fileLoading) {
			setError('Đang đọc file. Hãy chờ trước khi lưu.');
			return false;
		}
		if (!importText.trim()) return true;
		setImportOpen(true);
		setError(
			'Bạn còn dữ liệu chưa đưa vào bộ. Hãy kiểm tra và thêm dữ liệu, hoặc xóa ô nhập trước khi lưu.',
		);
		return false;
	}

	async function createDeck() {
		if (!checkPendingImport()) return false;
		if (!title.trim()) {
			setError('Hãy nhập tên bộ thẻ');
			return false;
		}
		const { valid, invalid } = cardsForSave();
		if (invalid) {
			setError('Một số thẻ chưa đủ câu hỏi và đáp án');
			return false;
		}
		if (!beginWrite()) return false;
		setNotice(null);
		try {
			const created = await adminFetch<ActiveRecallDeckDTO>(
				resolvedCourseId
					? `/api/admin/teaching/courses/${resolvedCourseId}/recall`
					: '/api/admin/active-recall',
				{
					method: 'POST',
					body: JSON.stringify({
						title,
						courseId: resolvedCourseId || undefined,
						subject,
						lessonLabel,
						description,
						status: 'DRAFT',
						cards: valid.map((card) => ({
							question: card.question,
							answer: card.answer,
							questionVi: card.questionVi,
							answerVi: card.answerVi,
						})),
					}),
				},
			);
			initialRef.current = snapshot;
			setNotice('Đã tạo bản nháp. Mở bộ để kiểm tra và công khai khi sẵn sàng.');
			router.replace(
				resolvedCourseId
					? routes.mySpaceTeachingRecallEdit(resolvedCourseId, created.id)
					: routes.admin.activeRecallEdit(created.id),
			);
			return true;
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không tạo được bộ thẻ');
			return false;
		} finally {
			endWrite();
		}
	}

	async function saveDeck(nextStatus = status) {
		if (savingRef.current) return false;
		if (!deck) return createDeck();
		if (!checkPendingImport()) return false;
		if (!title.trim()) {
			setError('Hãy nhập tên bộ thẻ');
			return false;
		}
		const { valid, invalid } = cardsForSave();
		if (invalid) {
			setError('Một số thẻ chưa đủ câu hỏi và đáp án');
			return false;
		}
		if (nextStatus === 'PUBLISHED' && !valid.length) {
			setError('Hãy thêm ít nhất một thẻ trước khi công khai.');
			return false;
		}
		if (!beginWrite()) return false;
		setNotice(null);
		try {
			const saved = await adminFetch<ActiveRecallDeckDTO>(deckApiPath(deck.id), {
				method: 'PATCH',
				body: JSON.stringify({
					title,
					slug: slug || undefined,
					courseId: resolvedCourseId || undefined,
					subject,
					lessonLabel,
					description,
					status: nextStatus,
					expectedUpdatedAt: deck.updatedAt,
					cards: valid.map((card) => ({
						id: card.id,
						question: card.question,
						answer: card.answer,
						questionVi: card.questionVi,
						answerVi: card.answerVi,
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
			initialRef.current = deckSnapshot(saved);
			setUndoImport(null);
			setUndoCard(null);
			setNotice(
				saved.status === 'PUBLISHED'
					? 'Đã lưu và công khai nội dung cho học viên.'
					: saved.status === 'ARCHIVED'
						? 'Đã lưu trữ. Học viên không còn thấy bộ thẻ.'
						: 'Đã lưu thay đổi.',
			);
			router.refresh();
			return true;
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không lưu được bộ thẻ');
			return false;
		} finally {
			endWrite();
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

	const [undoImport, setUndoImport] = useState<{ cards: EditorCard[]; text: string } | null>(null);
	const [cardPage, setCardPage] = useState(0);
	const pageCount = Math.max(1, Math.ceil(cards.length / 20));
	const visiblePage = Math.min(cardPage, pageCount - 1);
	const pending = dirty || Boolean(importText.trim()) || fileLoading;

	const leaveDialog = useLeaveGuard({
		dirty: () => pending || busy,
		save: async () => Boolean(await saveDeck()),
		buttonClassName: 'rounded-lg border border-border px-4 py-2 text-sm font-semibold',
		primaryButtonClassName: 'rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background',
	});

	async function stageImport(next: RecallImportPreview, mode: 'append' | 'replace') {
		if (busy) return false;
		if (
			mode === 'replace' &&
			!(await confirm({
				title: 'Thay thế thẻ trong bản chỉnh sửa',
				description: `Thay ${cards.length} thẻ hiện tại bằng ${next.summary.valid - next.summary.duplicates} thẻ đã kiểm tra. Bộ đã lưu chỉ thay đổi khi bạn lưu.`,
				confirmLabel: 'Thay thế',
			}))
		)
			return false;
		setUndoImport({ cards, text: importText });
		const incoming = next.rows
			.filter((row) => row.action !== 'skip')
			.map((row) => ({
				id: row.id,
				localId: row.id ?? crypto.randomUUID(),
				question: row.question,
				answer: row.answer,
				questionVi: row.questionVi ?? '',
				answerVi: row.answerVi ?? '',
			}));
		const updatedById = new Map(incoming.filter((card) => card.id).map((card) => [card.id, card]));
		const base = cards.filter(
			(card) =>
				card.id ||
				[card.question, card.answer, card.questionVi, card.answerVi].some(recallHasContent),
		);
		setCards(
			mode === 'replace'
				? incoming
				: [
						...base.map((card) => updatedById.get(card.id) ?? card),
						...incoming.filter((card) => !card.id),
					],
		);
		setCardPage(0);
		setCardErrors({});
		setUndoCard(null);
		setImportText('');
		setNotice('Đã đưa dữ liệu vào bản chỉnh sửa. Hãy kiểm tra thẻ rồi lưu.');
		return true;
	}

	async function archive() {
		if (!deck || busy) return;
		if (
			!(await confirm({
				title: 'Lưu trữ bộ thẻ',
				description:
					'Lưu nội dung đang chỉnh sửa và lưu trữ bộ này. Học viên sẽ không còn thấy bộ thẻ; bạn có thể khôi phục về bản nháp.',
				confirmLabel: 'Lưu và lưu trữ',
			}))
		)
			return;
		await saveDeck('ARCHIVED');
	}

	return (
		<>
			<div className="mx-auto max-w-[88rem] px-0 py-6 sm:px-4 sm:py-8">
				<div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
					<div>
						<p className="text-xs font-bold uppercase tracking-widest text-muted">
							Teaching · Active Recall
						</p>
						<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
							{deck ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ'}
						</h1>
						<p className="mt-2 text-sm text-muted">
							{deck
								? 'Nhập hoặc sửa thẻ → kiểm tra → lưu. Phím tắt: Cmd/Ctrl+S.'
								: 'Nhập tên bộ, dán nhiều Q/A hoặc thêm thẻ. Tạo bộ sẽ lưu thành bản nháp.'}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Link
							href={listHref}
							className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
						>
							Danh sách
						</Link>
						{deck && deck.status !== 'ARCHIVED' ? (
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
							{busy
								? 'Đang lưu…'
								: !deck
									? 'Tạo bộ thẻ'
									: status === 'PUBLISHED'
										? 'Lưu và công khai'
										: 'Lưu thay đổi'}
						</button>
					</div>
				</div>
				{error ? (
					<p role="alert" className="mt-4 text-sm text-red-700">
						{error}
					</p>
				) : null}
				{notice ? (
					<div
						role="status"
						className="mt-4 flex flex-wrap items-center gap-3 text-sm text-emerald-700"
					>
						<span>{notice}</span>
						{undoImport ? (
							<button
								type="button"
								className="font-semibold underline"
								disabled={busy}
								onClick={() => {
									setCards(undoImport.cards);
									setImportText(undoImport.text);
									setImportOpen(true);
									setUndoImport(null);
									setNotice('Đã hoàn tác nhập dữ liệu.');
								}}
							>
								Hoàn tác nhập
							</button>
						) : null}
						{undoCard ? (
							<button
								type="button"
								className="font-semibold underline"
								disabled={busy}
								onClick={() => {
									setCards((items) => [
										...items.slice(0, undoCard.index),
										undoCard.card,
										...items.slice(undoCard.index),
									]);
									setCardPage(Math.floor(undoCard.index / 20));
									setUndoCard(null);
									setNotice(null);
								}}
							>
								Hoàn tác
							</button>
						) : null}
					</div>
				) : null}

				<fieldset disabled={busy} className="min-w-0">
					<section className="mt-7 grid gap-4 border border-border bg-surface p-4 sm:p-5 md:grid-cols-2">
						<label className="text-sm font-semibold">
							Tên bộ thẻ
							<input
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
								placeholder="HRM · Lesson 1"
							/>
						</label>
						{deck ? (
							<label className="text-sm font-semibold">
								Trạng thái
								<select
									value={status}
									onChange={(event) => setStatus(event.target.value as ActiveRecallStatus)}
									className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
								>
									<option value="DRAFT">Bản nháp</option>
									<option value="PUBLISHED">Công khai</option>
									<option value="ARCHIVED" disabled={deck.status !== 'ARCHIVED'}>
										Lưu trữ
									</option>
								</select>
								<p className="mt-2 text-xs font-normal text-muted">
									{status === 'PUBLISHED'
										? 'Khi lưu, nội dung sẽ hiển thị cho học viên. Lớp học cần bật bộ này để hiện trong lớp.'
										: status === 'ARCHIVED'
											? 'Đang lưu trữ. Chọn Bản nháp rồi lưu để khôi phục.'
											: 'Chỉ bạn thấy bản nháp. Chọn Công khai và lưu khi đã kiểm tra xong.'}
								</p>
							</label>
						) : (
							<p className="self-end text-sm text-muted">
								Môn: {subject || 'đang kế thừa môn hiện tại'}
							</p>
						)}
					</section>

					{deck ? (
						<details
							className="mt-4 border border-border bg-surface p-4 sm:p-5"
							open={detailsOpen}
							onToggle={(event) => setDetailsOpen((event.target as HTMLDetailsElement).open)}
						>
							<summary className="cursor-pointer text-sm font-semibold text-ink">Chi tiết</summary>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<label className="text-sm font-semibold">
									Đường dẫn{' '}
									{deck.status !== 'DRAFT' ? (
										<span className="font-normal text-muted">(đã khóa sau xuất bản)</span>
									) : null}
									<input
										value={slug}
										onChange={(event) => setSlug(event.target.value)}
										disabled={deck.status !== 'DRAFT'}
										className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal disabled:opacity-60"
										placeholder="hrm-lesson-1"
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
							</div>
						</details>
					) : null}

					<RecallBulkImport
						cards={cards}
						text={importText}
						onTextChange={(text) => {
							setImportText(text);
							setError(null);
						}}
						onLoadingChange={setFileLoading}
						open={importOpen}
						onOpenChange={setImportOpen}
						busy={busy}
						filename={slug || 'active-recall'}
						onApply={stageImport}
						onNotice={(notice) => {
							setNotice(notice);
							setError(null);
						}}
					/>

					<section className="mt-7">
						<div className="flex items-center justify-between gap-4">
							<div>
								<h2 className="text-lg font-black text-foreground">
									Thẻ <span className="text-muted">{cards.length}</span>
								</h2>
								<p className="mt-1 text-sm text-muted">
									Kéo nút ⠿ để sắp thứ tự. Có thể chỉnh đậm, nghiêng, gạch chân và màu trên từng mặt
									thẻ.
								</p>
							</div>
							<button
								type="button"
								className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
								disabled={cards.length >= ACTIVE_RECALL_MAX_CARDS}
								onClick={() => {
									setUndoImport(null);
									setCards((items) => [...items, emptyCard()]);
									setCardPage(Math.floor(cards.length / 20));
								}}
							>
								+ Thêm thẻ
							</button>
						</div>
						<div className="mt-4 space-y-3">
							{cards.slice(visiblePage * 20, (visiblePage + 1) * 20).map((card, pageIndex) => {
								const index = visiblePage * 20 + pageIndex;
								return (
									<article
										key={card.localId}
										onDragOver={(event) => event.preventDefault()}
										onDrop={() => {
											if (dragIndex !== null) moveCard(dragIndex, index);
											setDragIndex(null);
										}}
										className={`grid gap-3 border bg-surface p-4 lg:grid-cols-[2.4rem_minmax(0,1fr)_auto] ${
											cardErrors[card.localId] ? 'border-error' : 'border-border'
										}`}
									>
										<div className="flex items-start gap-1 pt-1 text-sm text-muted">
											<span
												draggable
												onDragStart={() => setDragIndex(index)}
												className="cursor-grab select-none"
												aria-label={`Kéo thẻ ${index + 1}`}
											>
												⠿
											</span>
											<span className="tabular-nums">{index + 1}</span>
										</div>
										<RecallCardLanguageTabs
											idPrefix={`recall-${card.localId}`}
											disabled={busy}
											question={card.question}
											answer={card.answer}
											questionVi={card.questionVi}
											answerVi={card.answerVi}
											onChangeQuestion={(question) => updateCard(card.localId, { question })}
											onChangeAnswer={(answer) => updateCard(card.localId, { answer })}
											onChangeQuestionVi={(questionVi) => updateCard(card.localId, { questionVi })}
											onChangeAnswerVi={(answerVi) => updateCard(card.localId, { answerVi })}
										/>
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
												onClick={() => {
													setUndoImport(null);
													setCards((items) => [
														...items.slice(0, index + 1),
														{ ...card, id: undefined, localId: crypto.randomUUID() },
														...items.slice(index + 1),
													]);
												}}
												className="rounded p-2 text-sm hover:bg-background"
												aria-label="Nhân bản thẻ"
												disabled={cards.length >= ACTIVE_RECALL_MAX_CARDS}
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
										{cardErrors[card.localId] ? (
											<p className="text-sm font-semibold text-error lg:col-span-3" role="alert">
												{cardErrors[card.localId]}
											</p>
										) : null}
									</article>
								);
							})}
						</div>
						{pageCount > 1 ? (
							<nav
								aria-label="Trang thẻ"
								className="mt-4 flex flex-wrap items-center gap-3 text-sm"
							>
								<button
									type="button"
									disabled={visiblePage === 0}
									onClick={() => setCardPage(visiblePage - 1)}
									className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
								>
									Trang trước
								</button>
								<label>
									Trang{' '}
									<select
										aria-label="Chọn trang thẻ"
										value={visiblePage}
										onChange={(event) => setCardPage(Number(event.target.value))}
										className="rounded border border-border bg-background p-2"
									>
										{Array.from({ length: pageCount }, (_, page) => (
											<option key={page} value={page}>
												{page + 1}
											</option>
										))}
									</select>{' '}
									/ {pageCount} · {cards.length} thẻ
								</label>
								<button
									type="button"
									disabled={visiblePage === pageCount - 1}
									onClick={() => setCardPage(visiblePage + 1)}
									className="rounded-lg border border-border px-3 py-2 disabled:opacity-40"
								>
									Trang sau
								</button>
							</nav>
						) : null}
					</section>
				</fieldset>
				{dirty ? (
					<div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-lg">
						<span className="text-sm font-semibold">Bạn có thay đổi chưa lưu.</span>
						<button
							type="button"
							onClick={() => void saveDeck()}
							className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-50"
							disabled={busy}
						>
							{busy
								? 'Đang lưu…'
								: deck && status === 'PUBLISHED'
									? 'Lưu và công khai'
									: 'Lưu thay đổi'}
						</button>
					</div>
				) : null}
			</div>
			{leaveDialog}
			{dialog}
		</>
	);
}
