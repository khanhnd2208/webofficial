'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { formatMinutes, estimateReadingMinutes } from '@/features/learn/content';
import { autoSectionRawText, parseCourseMarkdown, planContentReplace } from '@/features/learn/lessonImport';
import { LEARN_MARKDOWN_GUIDE, LEARN_REFORMAT_PROMPT } from '@/features/learn/prompts';
import { LEARN_MAX_MARKDOWN } from '@/features/learn/schemas';
import { compareLectureText, countPlaces, wordDiff, type TextHunk } from '@/features/learn/textFidelity';
import type { LearnQuiz, LearnStudioLesson } from '@/features/learn/types';

import { StudioIcon } from './icons';
import StudioDialog from './StudioDialog';
import TextDiff from './TextDiff';
import { useCopy } from './useCopy';

function fingerprint(section: {
	title: string;
	summary: string;
	markdown: string;
	keyTakeaways?: string[];
	quiz?: LearnQuiz | null;
}): string {
	const questions =
		section.quiz?.questions
			.map((question) => [question.question, ...question.options, question.explanation].filter(Boolean).join('\n'))
			.join('\n\n') ?? '';
	return [section.title, section.summary, section.markdown, ...(section.keyTakeaways ?? []), questions].join('\n');
}

export default function ImportLessonDialog({
	lessons,
	selectedLessonId,
	onClose,
	onImport,
}: {
	lessons: LearnStudioLesson[];
	selectedLessonId: string | null;
	onClose: () => void;
	onImport: (input: { markdown: string; mode: 'create' | 'append' | 'replace'; lessonId?: string }) => Promise<void>;
}) {
	const [text, setText] = useState('');
	const [original, setOriginal] = useState('');
	const [pane, setPane] = useState<'ai' | 'original'>('ai');
	const [mode, setMode] = useState<'create' | 'append' | 'replace'>('create');
	const [lessonId, setLessonId] = useState(selectedLessonId ?? lessons[0]?.id ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [guideOpen, setGuideOpen] = useState(false);
	const [acked, setAcked] = useState(false);
	const [openDiffId, setOpenDiffId] = useState<string | null>(null);
	const deferredText = useDeferredValue(text);
	const deferredOriginal = useDeferredValue(original);
	const parsed = useMemo(() => (deferredText.trim() ? parseCourseMarkdown(deferredText) : null), [deferredText]);
	const fidelity = useMemo(
		() => (deferredOriginal.trim() && deferredText.trim() ? compareLectureText(deferredOriginal, deferredText) : null),
		[deferredOriginal, deferredText],
	);
	const { copied, copy } = useCopy();
	const sections = parsed?.lessons.flatMap((lesson) => lesson.sections) ?? [];
	const oversized = sections.some((section) => section.markdown.length > LEARN_MAX_MARKDOWN);
	const places = fidelity ? countPlaces(fidelity.hunks) : 0;
	const needsAck = places > 0;
	const multiLesson = (parsed?.lessons.length ?? 0) > 1 && mode !== 'create';

	const replaceRows = useMemo(() => {
		if (mode !== 'replace' || !deferredText.trim()) return [];
		const current = lessons.find((lesson) => lesson.id === lessonId);
		if (!current) return [];
		const incoming = parseCourseMarkdown(deferredText).lessons.flatMap((lesson) => lesson.sections);
		const plan = planContentReplace(current.sections, incoming);
		const rows: Array<{ id: string; title: string; status: 'same' | 'changed' | 'new' | 'delete'; hunks: TextHunk[] }> = [];
		for (const update of plan.updates) {
			const existing = current.sections.find((section) => section.id === update.id);
			const hunks = existing ? wordDiff(fingerprint(existing), fingerprint(update.section)) : [];
			rows.push({
				id: update.id,
				title: update.section.title,
				status: hunks.length ? 'changed' : 'same',
				hunks,
			});
		}
		plan.creates.forEach((section, index) => {
			rows.push({ id: `new-${index}`, title: section.title, status: 'new', hunks: [] });
		});
		for (const deleted of plan.deletes) {
			rows.push({ id: deleted.id, title: deleted.title, status: 'delete', hunks: [] });
		}
		return rows;
	}, [mode, lessons, lessonId, deferredText]);

	async function submit() {
		setBusy(true);
		setError(null);
		try {
			await onImport({ markdown: text, mode, lessonId: mode === 'create' ? undefined : lessonId });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không nhập được bài học');
			setBusy(false);
		}
	}

	const statusLabel = { same: 'Không đổi', changed: 'Sửa', new: 'Mới', delete: 'Sẽ xóa' } as const;

	return (
		<StudioDialog
			title="Nhập bài học từ Markdown"
			onClose={onClose}
			footer={
				<>
					{error ? <p className="mr-auto text-sm text-error">{error}</p> : null}
					{needsAck ? (
						<label className="mr-auto flex items-center gap-2 text-sm">
							<input type="checkbox" checked={acked} onChange={(event) => setAcked(event.target.checked)} />
							Tôi đã xem {places} chỗ khác và vẫn muốn nhập
						</label>
					) : null}
					<button type="button" className="ln-btn" onClick={onClose}>
						Hủy
					</button>
					<button
						type="button"
						className="ln-btn ln-btn--primary"
						disabled={busy || !sections.length || oversized || (mode !== 'create' && !lessonId) || (needsAck && !acked)}
						onClick={submit}
					>
						{busy ? 'Đang nhập…' : `Nhập ${sections.length} mục`}
					</button>
				</>
			}
		>
			<ol className="ln-steps">
				<li>
					<button type="button" className="ln-link-btn" onClick={() => copy(LEARN_REFORMAT_PROMPT)}>
						<StudioIcon name="copy" size={14} /> {copied ? 'Đã chép prompt' : 'Chép prompt AI định dạng bài'}
					</button>
				</li>
				<li>Mở ChatGPT, Claude hoặc Gemini, dán prompt, thay dòng [DÁN…] bằng bài, rồi gửi. Bài dài thì nhắn “tiếp” tới khi hết.</li>
				<li>Chép cả câu trả lời (hoặc nút chép của khối code) vào ô Kết quả AI. Dán nối nhiều phần cũng được.</li>
				<li>Dán bản gốc vào ô Bản gốc để đối chiếu từng chữ.</li>
			</ol>
			<div className="ln-split">
				<div className="flex min-h-0 flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<select className="ln-input" value={mode} aria-label="Cách nhập" onChange={(event) => setMode(event.target.value as typeof mode)}>
							<option value="create">Tạo bài mới</option>
							<option value="append">Thêm mục vào bài đang chọn</option>
							<option value="replace">Thay nội dung bài</option>
						</select>
						{mode !== 'create' ? (
							<select className="ln-input" value={lessonId} aria-label="Bài nhận nội dung" onChange={(event) => setLessonId(event.target.value)}>
								{lessons.map((lesson) => (
									<option key={lesson.id} value={lesson.id}>
										{lesson.title}
									</option>
								))}
							</select>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
						<div className="ln-segmented" role="tablist" aria-label="Nguồn dán">
							<button type="button" role="tab" aria-selected={pane === 'ai'} onClick={() => setPane('ai')}>
								Kết quả AI
							</button>
							<button type="button" role="tab" aria-selected={pane === 'original'} onClick={() => setPane('original')}>
								Bản gốc
							</button>
						</div>
						<button
							type="button"
							className="ln-link-btn"
							disabled={!text.trim()}
							onClick={() => setText((value) => autoSectionRawText(value))}
							title="Biến các đề mục I., 1., Chương… thành dấu phân mục"
						>
							Tự chia mục theo đề mục
						</button>
						<button type="button" className="ln-link-btn" onClick={() => setGuideOpen((value) => !value)}>
							{guideOpen ? 'Ẩn cú pháp' : 'Xem cú pháp'}
						</button>
					</div>
					{guideOpen ? <pre className="ln-guide">{LEARN_MARKDOWN_GUIDE}</pre> : null}
					<textarea
						autoFocus
						className="ln-editor__source min-h-[22rem] flex-1"
						aria-label={pane === 'ai' ? 'Kết quả AI' : 'Bản gốc'}
						value={pane === 'ai' ? text : original}
						onChange={(event) => {
							if (pane === 'ai') setText(event.target.value);
							else setOriginal(event.target.value);
							setAcked(false);
						}}
						spellCheck={false}
						placeholder={
							pane === 'ai'
								? 'Dán kết quả AI vào đây.\n\nĐã có dấu "=== SECTION: … ===" thì nhập ngay.\nChỉ là văn bản thường: bấm "Tự chia mục theo đề mục".'
								: 'Dán nguyên bài giảng gốc (Word, Docs) để đối chiếu. Không bắt buộc, nhưng nên có.'
						}
					/>
				</div>
				<div className="ln-preview">
					<p className="ln-preview__label">Xem trước</p>
					{fidelity ? (
						fidelity.hunks.length === 0 ? (
							<p className="ln-fidelity ln-fidelity--ok">Khớp 100% — AI không đổi chữ nào</p>
						) : (
							<div className="ln-fidelity">
								<p>Khác {places} chỗ</p>
								<TextDiff hunks={fidelity.hunks} />
							</div>
						)
					) : text.trim() ? (
						<p className="ln-fidelity ln-fidelity--hint">Dán bản gốc ở tab Bản gốc để đối chiếu từng chữ.</p>
					) : null}
					{parsed ? (
						<>
							{parsed.lessons.map((lesson) => (
								<div key={lesson.lessonTitle}>
									<p className="font-display text-xl font-medium">{lesson.lessonTitle}</p>
									{lesson.lessonDescription ? (
										<p className="mt-1 text-sm text-ink-secondary">{lesson.lessonDescription}</p>
									) : null}
								</div>
							))}
							{parsed.warnings.map((warning) => (
								<p key={warning} className="ln-warning">
									{warning}
								</p>
							))}
							{multiLesson ? (
								<p className="ln-warning">Có nhiều dòng # — chế độ này sẽ gộp nhiều bài vào một bài.</p>
							) : null}
							{replaceRows.some((row) => row.status === 'delete') ? (
								<p className="ln-warning">Mục bị xóa sẽ mất tiến độ và ghi chú của học viên.</p>
							) : null}
							{replaceRows.length ? (
								<ul className="ln-preview__sections">
									{replaceRows.map((row) => (
										<li key={row.id}>
											<span className="min-w-0 flex-1">
												<span className="block font-medium">{row.title}</span>
												<button
													type="button"
													className="ln-link-btn"
													onClick={() => setOpenDiffId((current) => (current === row.id ? null : row.id))}
												>
													{statusLabel[row.status]}
													{row.status === 'changed' ? ` ${countPlaces(row.hunks)} chỗ` : ''}
												</button>
												{openDiffId === row.id && row.hunks.length ? <TextDiff hunks={row.hunks} /> : null}
											</span>
										</li>
									))}
								</ul>
							) : (
								<ol className="ln-preview__sections">
									{sections.map((section, index) => (
										<li key={index}>
											<span className="ln-preview__index tabular-nums">{index + 1}</span>
											<span className="min-w-0 flex-1">
												<span className="block font-medium">
													{section.type === 'QUIZ' ? 'Kiểm tra · ' : ''}
													{section.title}
												</span>
												{section.summary ? (
													<span className="block text-sm text-ink-secondary">{section.summary}</span>
												) : null}
											</span>
											<span className="text-xs text-ink-secondary tabular-nums">
												{section.type === 'QUIZ'
													? `${section.quiz?.questions.length ?? 0} câu`
													: `${section.wordCount} từ · ${formatMinutes(section.durationMinutes ?? estimateReadingMinutes(section.markdown))}`}
											</span>
										</li>
									))}
								</ol>
							)}
						</>
					) : (
						<p className="text-sm text-ink-secondary">Các mục sẽ hiện ở đây khi bạn dán nội dung.</p>
					)}
				</div>
			</div>
		</StudioDialog>
	);
}
