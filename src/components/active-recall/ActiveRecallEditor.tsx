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
import { toRecallCsv, toRecallPaste } from '@/features/active-recall/parser';
import { recallHasContent } from '@/features/active-recall/richText';
import { routes } from '@/config/routes';

import RecallCardLanguageTabs from './RecallCardLanguageTabs';

type EditorCard = {
	id?: string;
	localId: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
};

const emptyCard = (): EditorCard => ({
	localId: crypto.randomUUID(),
	question: '',
	answer: '',
	questionVi: '',
	answerVi: '',
});

const ACTIVE_RECALL_AI_FORMATTING_GUIDE = `Khi soạn nội dung Active Recall, hãy trả về đúng định dạng để tôi có thể copy-paste trực tiếp.

Mỗi thẻ dùng một trong các cặp nhãn:
- Q: / A:
- Question: / Answer:
- Câu hỏi: / Đáp án:

Nếu muốn thêm bản dịch tiếng Việt cho thẻ (khi câu hỏi/đáp án gốc không phải tiếng Việt), thêm 2 dòng tùy chọn ngay sau Q:/A: của thẻ đó:
- QVI: (bản dịch của câu hỏi)
- AVI: (bản dịch của đáp án)
Có thể chỉ dùng QVI: hoặc AVI: nếu chỉ cần dịch một phía. Bỏ qua cả hai nếu thẻ không cần bản dịch.

Có thể ngăn cách các thẻ bằng dòng ---.

Hỗ trợ định dạng:
- Đậm: **nội dung**
- Nghiêng: *nội dung*
- Gạch chân: <u>nội dung</u>
- Màu chữ: <span style="color: #dc2626">nội dung</span>

Chỉ dùng các màu sau:
#475569, #dc2626, #ea580c, #ca8a04, #15803d, #2563eb, #7c3aed, #db2777.

Có thể kết hợp định dạng, ví dụ:
<u><span style="color: #dc2626">Ý rất quan trọng</span></u>
**<u>Khái niệm cốt lõi</u>**
*Ví dụ minh họa*

Hỗ trợ danh sách:
- Ý thứ nhất
- Ý thứ hai

hoặc:
1. Ý thứ nhất
2. Ý thứ hai

Quy tắc cho bullet points:
- Chỉ đặt bullet trong nội dung câu hỏi hoặc đáp án, sau nhãn Q:/A: hoặc Câu hỏi:/Đáp án:.
- Để danh sách dễ đọc, đặt nhãn đáp án trên một dòng riêng, rồi bắt đầu mỗi bullet ở dòng kế tiếp.
- Mỗi mục phải bắt đầu chính xác bằng "- " (gạch ngang + khoảng trắng) hoặc "1. " (số + dấu chấm + khoảng trắng).
- Không thụt lề đầu dòng, không dùng bullet lồng nhau, không dùng ký hiệu •, *, hoặc – thay cho "- ".
- Không đặt Q:, A:, Question:, Answer:, Câu hỏi:, Đáp án: hoặc --- ở đầu một bullet; nếu cần dùng các cụm này, thêm dấu \\ ở trước.

Ví dụ danh sách đúng:

Câu hỏi: Các mục tiêu của HRM là gì?
Đáp án:
- Thu hút nhân sự phù hợp
- Phát triển năng lực
- Giữ chân nhân viên

Ví dụ danh sách đánh số đúng:

Câu hỏi: Quy trình tuyển dụng gồm những bước nào?
Đáp án:
1. Xác định nhu cầu tuyển dụng
2. Thu hút ứng viên
3. Sàng lọc và lựa chọn

Không dùng bảng Markdown, ảnh, link, heading (#), code block, HTML/CSS ngoài các thẻ <u> và <span style="color: ...">.

Nếu nội dung câu hỏi hoặc đáp án có một dòng bắt đầu bằng Q:, A:, QVI:, AVI:, Question:, Answer:, Câu hỏi:, Đáp án: hoặc ---, hãy thêm dấu \\ ở đầu dòng để hệ thống không hiểu nhầm đó là thẻ mới.

Ví dụ đầu ra:

Câu hỏi: **HRM** là gì?
Đáp án: HRM là *quản trị nguồn nhân lực*.

---
Q: What is job autonomy?
A: The degree of <u>freedom</u> an employee has in deciding how to do their work.
QVI: Job autonomy là gì?
AVI: Mức độ <u>tự do</u> mà nhân viên có khi quyết định cách thực hiện công việc.

---
Câu hỏi: Vì sao job autonomy quan trọng?
Đáp án:
- Tăng <u>trách nhiệm</u>
- Hỗ trợ động lực làm việc
- <span style="color: #dc2626">Giảm sự phụ thuộc vào giám sát liên tục</span>`;

async function copyText(value: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}
	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.append(textarea);
	textarea.select();
	const copied = document.execCommand('copy');
	textarea.remove();
	if (!copied) throw new Error('COPY_FAILED');
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
			questionVi: card.questionVi,
			answerVi: card.answerVi,
		})) ?? []
	);
}

function deckSnapshot(deck: ActiveRecallDeckDTO) {
	return JSON.stringify({
		title: deck.title,
		slug: deck.slug,
		subject: deck.subject,
		lessonLabel: deck.lessonLabel,
		description: deck.description,
		status: deck.status,
		cards: deck.cards.map(({ id, question, answer, questionVi, answerVi }) => ({
			id,
			question,
			answer,
			questionVi,
			answerVi,
		})),
	});
}

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
	const [importOpen, setImportOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [importText, setImportText] = useState('');
	const [preview, setPreview] = useState<RecallImportPreview | null>(null);
	const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [undoCard, setUndoCard] = useState<EditorCard | null>(null);
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

	function cardsForSave() {
		const nextErrors: Record<string, string> = {};
		const valid: EditorCard[] = [];
		for (const card of cards) {
			const hasQuestion = recallHasContent(card.question);
			const hasAnswer = recallHasContent(card.answer);
			if (!hasQuestion && !hasAnswer) continue;
			if (!hasQuestion) nextErrors[card.localId] = 'Thẻ thiếu câu hỏi';
			else if (!hasAnswer) nextErrors[card.localId] = 'Thẻ thiếu đáp án';
			else valid.push(card);
		}
		setCardErrors(nextErrors);
		return { valid, invalid: Object.keys(nextErrors).length > 0 };
	}

	async function createDeck() {
		if (!title.trim()) {
			setError('Hãy nhập tên bộ thẻ');
			return;
		}
		const { valid, invalid } = cardsForSave();
		if (invalid) {
			setError('Một số thẻ chưa đủ câu hỏi và đáp án');
			return;
		}
		if (!beginWrite()) return;
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
			router.replace(
				resolvedCourseId
					? routes.mySpaceTeachingRecallEdit(resolvedCourseId, created.id)
					: routes.admin.activeRecallEdit(created.id),
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không tạo được bộ thẻ');
		} finally {
			endWrite();
		}
	}

	async function saveDeck() {
		if (!deck) return createDeck();
		const { valid, invalid } = cardsForSave();
		if (invalid) {
			setError('Một số thẻ chưa đủ câu hỏi và đáp án');
			return;
		}
		if (!beginWrite()) return;
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
					status,
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
			setNotice('Đã lưu thay đổi.');
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không lưu được bộ thẻ');
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

	async function runPreview() {
		if (!deck || !importText.trim()) return;
		if (dirty) {
			setError('Hãy lưu thay đổi trước khi import.');
			return;
		}
		if (!beginWrite()) return;
		setPreview(null);
		try {
			setPreview(
				await adminFetch<RecallImportPreview>(
					`${deckApiPath(deck.id)}/import?dryRun=1&mode=${importMode}`,
					{
						method: 'POST',
						body: JSON.stringify({ text: importText, mode: importMode }),
					},
				),
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không đọc được dữ liệu');
		} finally {
			endWrite();
		}
	}

	async function commitImport(mode: 'append' | 'replace') {
		if (!deck || !preview || preview.summary.invalid || preview.summary.orphanAnswers) return;
		if (dirty) {
			setError('Hãy lưu thay đổi trước khi import.');
			return;
		}
		if (
			mode === 'replace' &&
			!(await confirm({
				title: 'Thay thế thẻ',
				description: 'Thay thế sẽ xóa các thẻ hiện có không nằm trong file import. Tiếp tục?',
				confirmLabel: 'Thay thế',
			}))
		)
			return;
		if (!beginWrite()) return;
		setNotice(null);
		try {
			const imported = await adminFetch<{ deck: ActiveRecallDeckDTO }>(
				`${deckApiPath(deck.id)}/import`,
				{
					method: 'POST',
					body: JSON.stringify({ text: importText, mode, expectedUpdatedAt: deck.updatedAt }),
				},
			);
			setDeck(imported.deck);
			setCards(deckCards(imported.deck));
			initialRef.current = deckSnapshot(imported.deck);
			setPreview(null);
			setImportText('');
			setNotice('Đã import dữ liệu.');
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không import được dữ liệu');
		} finally {
			endWrite();
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
		if (!beginWrite()) return;
		try {
			await adminFetch(deckApiPath(deck.id), {
				method: 'PATCH',
				body: JSON.stringify({ status: 'ARCHIVED', expectedUpdatedAt: deck.updatedAt }),
			});
			router.push(listHref);
			router.refresh();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể lưu trữ bộ thẻ');
		} finally {
			endWrite();
		}
	}

	return (
		<>
			<div className="mx-auto max-w-[88rem] px-6 py-8">
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
								? 'Sửa thẻ trực tiếp. Phím tắt: Cmd/Ctrl+S.'
								: 'Nhập tên bộ và nội dung thẻ. Slug tự sinh, mặc định bản nháp.'}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Link
							href={listHref}
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
								<option value="ARCHIVED">Lưu trữ</option>
							</select>
						</label>
					) : (
						<p className="self-end text-sm text-muted">
							Môn: {subject || 'đang kế thừa môn hiện tại'}
						</p>
					)}
				</section>

				{deck ? (
					<details
						className="mt-4 border border-border bg-surface p-5"
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

				{deck ? (
					<details
						className="mt-4 border border-border bg-surface p-5"
						open={importOpen}
						onToggle={(event) => setImportOpen((event.target as HTMLDetailsElement).open)}
					>
						<summary className="cursor-pointer text-sm font-semibold text-ink">Nhập nhiều</summary>
						<div className="mt-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted">
									Dán Q:/A: hoặc CSV. Có thể sao chép hướng dẫn cho AI.
								</p>
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
										onClick={() =>
											void copyText(ACTIVE_RECALL_AI_FORMATTING_GUIDE)
												.then(() => setNotice('Đã sao chép hướng dẫn định dạng cho AI.'))
												.catch(() => setError('Không thể sao chép hướng dẫn. Hãy thử lại.'))
										}
									>
										Sao chép hướng dẫn cho AI
									</button>
									<button
										type="button"
										className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
										onClick={() =>
											download(
												`${deck.slug}.csv`,
												toRecallCsv(
													cards.map((card, index) => ({
														id: card.id ?? '',
														question: card.question,
														answer: card.answer,
														questionVi: card.questionVi,
														answerVi: card.answerVi,
														position: index,
													})),
												),
											)
										}
									>
										Xuất CSV
									</button>
									<button
										type="button"
										className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
										onClick={() =>
											void copyText(toRecallPaste(cards))
												.then(() => setNotice('Đã sao chép dạng Q/A.'))
												.catch(() => setError('Không thể sao chép Q/A. Hãy thử lại.'))
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
								placeholder={
									'Q: What is **HRM**?\nA: A *system* with <u>policies</u>\n---\nQuestion: ...\nAnswer: ...'
								}
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
						</div>
					</details>
				) : null}

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
							onClick={() => setCards((items) => [...items, emptyCard()])}
						>
							+ Thêm thẻ
						</button>
					</div>
					<div className="mt-4 space-y-3">
						{cards.map((card, index) => (
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
								{cardErrors[card.localId] ? (
									<p className="text-sm font-semibold text-error lg:col-span-3" role="alert">
										{cardErrors[card.localId]}
									</p>
								) : null}
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
							className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background disabled:opacity-50"
							disabled={busy}
						>
							{busy ? 'Đang lưu…' : 'Lưu thay đổi'}
						</button>
					</div>
				) : null}
			</div>
			{dialog}
		</>
	);
}
