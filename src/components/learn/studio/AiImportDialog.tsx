'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import {
	discussionImportReport,
	lessonImportReport,
	type ImportReport,
} from '@/features/learn/importChecks';
import { parseDiscussionPaste } from '@/features/learn/discussionImport';
import {
	cleanAiPaste,
	parseCourseMarkdown,
	planContentReplace,
} from '@/features/learn/lessonImport';
import { LEARN_FORMAT_PROMPTS } from '@/features/learn/prompts';
import type { LearnDiscussionQuestion, LearnStudioLesson } from '@/features/learn/types';

import { StudioIcon } from './icons';
import ImportImagePicker from './ImportImagePicker';
import { DiscussionImportPreview, ImportSummary, LessonImportPreview } from './ImportPreview';
import { useStudioConfirm } from './StudioConfirm';
import StudioDialog from './StudioDialog';
import { ManualCopyField, useCopy } from './useCopy';

export type AiImportKind = 'lesson' | 'discussion';

const KIND_OPTIONS: Array<{ id: AiImportKind; label: string }> = [
	{ id: 'lesson', label: 'Bài giảng' },
	{ id: 'discussion', label: 'Phản biện' },
];

const DEFAULT_SECTION_TITLE = 'Câu hỏi phản biện';

export type AiImportInput =
	| {
			kind: 'lesson';
			markdown: string;
			mode: 'create' | 'replace';
			lessonId?: string;
	  }
	| {
			kind: 'discussion';
			mode: 'create';
			lessonId: string;
			title: string;
			questions: LearnDiscussionQuestion[];
	  }
	| {
			kind: 'discussion';
			mode: 'append' | 'replace';
			sectionId: string;
			questions: LearnDiscussionQuestion[];
	  };

export default function AiImportDialog({
	kind: initialKind,
	lockKind = false,
	lessons,
	selectedLessonId,
	target,
	courseTitle,
	onSave,
	onClose,
}: {
	kind: AiImportKind;
	lockKind?: boolean;
	lessons: LearnStudioLesson[];
	selectedLessonId: string | null;
	target?: { sectionId: string; count: number };
	courseTitle: string;
	onSave: (input: AiImportInput) => Promise<void>;
	onClose: () => void;
}) {
	const [kind, setKind] = useState<AiImportKind>(initialKind);
	const [text, setText] = useState('');
	const [lessonMode, setLessonMode] = useState<'create' | 'replace'>('create');
	const [questionMode, setQuestionMode] = useState<'append' | 'replace'>('append');
	const [lessonId, setLessonId] = useState(selectedLessonId ?? lessons[0]?.id ?? '');
	const [sectionTitle, setSectionTitle] = useState(DEFAULT_SECTION_TITLE);
	const [uploadBusy, setUploadBusy] = useState(false);
	const [busy, setBusy] = useState(false);
	/** Narrow screens show one pane at a time; wide screens always show both. */
	const [pane, setPane] = useState<'paste' | 'preview'>('paste');
	const [promptCopied, setPromptCopied] = useState(false);
	const { confirm, confirmDialog } = useStudioConfirm();
	const [error, setError] = useState<string | null>(null);
	const deferredText = useDeferredValue(text);
	const { copied, copy, manual } = useCopy();

	const cleaned = useMemo(
		() => (deferredText.trim() ? cleanAiPaste(deferredText) : null),
		[deferredText],
	);
	const lessonParsed = useMemo(
		() => (kind === 'lesson' && cleaned ? parseCourseMarkdown(cleaned.markdown) : null),
		[kind, cleaned],
	);
	const discussionParsed = useMemo(
		() => (kind === 'discussion' ? parseDiscussionPaste(cleaned?.markdown ?? '') : null),
		[kind, cleaned],
	);

	const lessonSections = lessonParsed?.lessons.flatMap((lesson) => lesson.sections) ?? [];
	const questionCount = discussionParsed?.questions.length ?? 0;
	const deletedCount = useMemo(() => {
		if (kind !== 'lesson' || lessonMode !== 'replace' || !cleaned) return 0;
		const current = lessons.find((lesson) => lesson.id === lessonId);
		if (!current) return 0;
		const incoming = parseCourseMarkdown(cleaned.markdown).lessons.flatMap(
			(lesson) => lesson.sections,
		);
		return planContentReplace(current.sections, incoming).deletes.length;
	}, [kind, lessonMode, lessons, lessonId, cleaned]);

	const existingCount = target && questionMode === 'append' ? target.count : 0;
	const report = useMemo<ImportReport | null>(() => {
		if (!cleaned) return null;
		if (kind === 'lesson') {
			if (!lessonParsed) return null;
			return lessonImportReport({
				markdown: cleaned.markdown,
				parsed: { ...lessonParsed, warnings: [...cleaned.warnings, ...lessonParsed.warnings] },
				merging: lessonMode === 'replace',
			});
		}
		return discussionImportReport({
			markdown: cleaned.markdown,
			pasteWarnings: cleaned.warnings,
			questions: discussionParsed?.questions ?? [],
			parseWarnings: discussionParsed?.warnings ?? [],
			existingCount,
		});
	}, [kind, cleaned, lessonParsed, lessonMode, discussionParsed, existingCount]);

	const destinationReady =
		kind === 'lesson'
			? lessonMode === 'create' || Boolean(lessonId)
			: Boolean(target) || (Boolean(lessonId) && sectionTitle.trim().length > 0);
	const contentReady = kind === 'lesson' ? lessonSections.length > 0 : questionCount > 0;
	const canSave =
		destinationReady && contentReady && !report?.errors && text.trim() === deferredText.trim();

	async function copyPrompt() {
		await copy(LEARN_FORMAT_PROMPTS[kind]);
		setPromptCopied(true);
	}

	function changeKind(next: AiImportKind) {
		setKind(next);
		setError(null);
		setPromptCopied(false);
	}

	async function requestClose() {
		if (busy || uploadBusy) return;
		if (text.trim()) {
			const accepted = await confirm({
				title: 'Bỏ nội dung đã dán?',
				body: 'Phần đã dán chưa được áp dụng.',
				confirmLabel: 'Bỏ',
				cancelLabel: 'Ở lại',
				danger: true,
			});
			if (!accepted) return;
		}
		onClose();
	}

	async function submit() {
		if (uploadBusy || busy) return;
		if (kind === 'lesson' && lessonMode === 'replace' && deletedCount > 0) {
			const accepted = await confirm({
				title: 'Thay nội dung và xóa mục cũ?',
				body: `${deletedCount} mục không còn trong bản dán sẽ bị xóa, cùng tiến độ của học viên trên các mục đó.`,
				confirmLabel: 'Thay và xóa',
				danger: true,
			});
			if (!accepted) return;
		}
		if (kind === 'discussion' && target && questionMode === 'replace') {
			const accepted = await confirm({
				title: 'Thay toàn bộ câu hỏi?',
				body: 'Câu hiện có trong mục này sẽ được thay bằng nội dung vừa dán.',
				confirmLabel: 'Thay câu hỏi',
				danger: true,
			});
			if (!accepted) return;
		}
		setBusy(true);
		setError(null);
		try {
			if (kind === 'lesson') {
				await onSave({
					kind: 'lesson',
					markdown: text,
					mode: lessonMode,
					lessonId: lessonMode === 'create' ? undefined : lessonId,
				});
				return;
			}
			const questions = discussionParsed?.questions ?? [];
			await onSave(
				target
					? { kind: 'discussion', mode: questionMode, sectionId: target.sectionId, questions }
					: {
							kind: 'discussion',
							mode: 'create',
							lessonId,
							title: sectionTitle.trim(),
							questions,
						},
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được nội dung');
			setBusy(false);
		}
	}

	const unit = kind === 'lesson' ? 'mục' : 'câu';
	const count = kind === 'lesson' ? lessonSections.length : questionCount;
	const saveLabel = `Lưu ${count} ${unit}`;
	const destination =
		kind === 'lesson'
			? lessonMode === 'create'
				? 'bài mới'
				: (lessons.find((lesson) => lesson.id === lessonId)?.title ?? 'bài đã chọn')
			: target
				? 'mục đang mở'
				: 'mục phản biện mới';

	return (
		<>
			<StudioDialog
				title="Nhập nội dung"
				busy={busy || uploadBusy}
				onClose={() => void requestClose()}
				footer={
					<>
						{error ? (
							<p className="mr-auto text-sm text-error" role="alert">
								{error}
							</p>
						) : report?.errors ? (
							<p className="mr-auto text-sm text-error">Sửa lỗi trong bản dán để lưu.</p>
						) : null}
						<button
							type="button"
							className="ln-btn"
							onClick={() => void requestClose()}
							disabled={busy}
						>
							Hủy
						</button>
						<button
							type="button"
							className="ln-btn ln-btn--primary"
							disabled={busy || uploadBusy || !canSave}
							onClick={() => void submit()}
						>
							{busy ? 'Đang lưu…' : saveLabel}
						</button>
					</>
				}
			>
				<div className="mb-3 flex flex-col gap-3">
					{lockKind ? null : (
						<div className="ln-segmented self-start" role="radiogroup" aria-label="Loại nội dung">
							{KIND_OPTIONS.map((option) => (
								<button
									key={option.id}
									type="button"
									role="radio"
									aria-checked={kind === option.id}
									onClick={() => changeKind(option.id)}
								>
									{option.label}
								</button>
							))}
						</div>
					)}
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-ink-secondary">
							Đích: {courseTitle} → {destination}
						</span>
						<DestinationFields
							kind={kind}
							lessons={lessons}
							lessonId={lessonId}
							onLessonId={setLessonId}
							lessonMode={lessonMode}
							onLessonMode={setLessonMode}
							target={target}
							questionMode={questionMode}
							onQuestionMode={setQuestionMode}
							sectionTitle={sectionTitle}
							onSectionTitle={setSectionTitle}
						/>
					</div>
					<ol className="ln-import-todo" aria-label="Việc cần làm">
						<li data-done={promptCopied || undefined}>
							<button type="button" className="ln-link-btn" onClick={() => void copyPrompt()}>
								<StudioIcon name="copy" size={14} />{' '}
								{copied ? 'Đã chép prompt' : 'Chép prompt định dạng'}
							</button>
							<span className="text-ink-secondary">
								{' '}
								rồi đưa cho AI cùng {kind === 'lesson' ? 'bài giảng gốc' : 'câu hỏi gốc'}
							</span>
						</li>
						<li data-done={text.trim() ? true : undefined}>Dán kết quả AI vào ô bên dưới</li>
						<li data-done={canSave || undefined}>
							{report ? (
								<ImportSummary count={count} unit={unit} report={report} />
							) : (
								'Xem trước như học viên, sửa lỗi nếu có, rồi lưu'
							)}
						</li>
					</ol>
					{manual ? <ManualCopyField text={manual} /> : null}
					<div
						className="ln-segmented ln-split__switch self-start"
						role="tablist"
						aria-label="Khung"
					>
						<button
							type="button"
							role="tab"
							aria-selected={pane === 'paste'}
							onClick={() => setPane('paste')}
						>
							Dán
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={pane === 'preview'}
							onClick={() => setPane('preview')}
						>
							Xem trước{report?.errors ? ` · ${report.errors} lỗi` : ''}
						</button>
					</div>
				</div>
				<div className="ln-split" data-pane={pane}>
					<textarea
						autoFocus
						className="ln-editor__source min-h-[22rem]"
						aria-label="Kết quả AI"
						value={text}
						onChange={(event) => setText(event.target.value)}
						onPaste={() => setPane('preview')}
						spellCheck={false}
						placeholder={
							kind === 'lesson'
								? 'Dán kết quả AI vào đây: bắt đầu bằng dòng # Tên bài, mỗi mục mở bằng === SECTION: … ==='
								: 'Dán kết quả AI vào đây: mỗi câu mở bằng dòng "Câu 1:", đề bài, rồi dòng "Đáp án mẫu:"'
						}
					/>
					<div className="ln-preview" aria-label="Xem như học viên">
						<p className="ln-preview__label">Xem như học viên</p>
						<ImportImagePicker markdown={text} onChange={setText} onBusyChange={setUploadBusy} />
						{deletedCount > 0 ? (
							<p className="ln-warning">
								{deletedCount} mục không còn trong bản dán sẽ bị xóa, học viên mất tiến độ trên các
								mục đó.
							</p>
						) : null}
						{!report ? (
							<p className="text-sm text-ink-secondary">
								{kind === 'lesson' ? 'Các mục' : 'Các câu'} sẽ hiện ở đây đúng như trang học viên
								khi bạn dán nội dung.
							</p>
						) : kind === 'lesson' && lessonParsed ? (
							<LessonImportPreview parsed={lessonParsed} report={report} />
						) : (
							<DiscussionImportPreview
								questions={discussionParsed?.questions ?? []}
								report={report}
							/>
						)}
					</div>
				</div>
			</StudioDialog>
			{confirmDialog}
		</>
	);
}

function DestinationFields({
	kind,
	lessons,
	lessonId,
	onLessonId,
	lessonMode,
	onLessonMode,
	target,
	questionMode,
	onQuestionMode,
	sectionTitle,
	onSectionTitle,
}: {
	kind: AiImportKind;
	lessons: LearnStudioLesson[];
	lessonId: string;
	onLessonId: (id: string) => void;
	lessonMode: 'create' | 'replace';
	onLessonMode: (mode: 'create' | 'replace') => void;
	target?: { sectionId: string; count: number };
	questionMode: 'append' | 'replace';
	onQuestionMode: (mode: 'append' | 'replace') => void;
	sectionTitle: string;
	onSectionTitle: (title: string) => void;
}) {
	if (kind === 'lesson') {
		return (
			<div className="flex flex-wrap items-center gap-2">
				<select
					className="ln-input"
					value={lessonMode}
					aria-label="Cách nhập"
					onChange={(event) => onLessonMode(event.target.value as 'create' | 'replace')}
				>
					<option value="create">Tạo bài mới</option>
					<option value="replace">Thay nội dung bài</option>
				</select>
				{lessonMode === 'replace' ? (
					<select
						className="ln-input"
						value={lessonId}
						aria-label="Bài nhận nội dung"
						onChange={(event) => onLessonId(event.target.value)}
					>
						{lessons.map((lesson) => (
							<option key={lesson.id} value={lesson.id}>
								{lesson.title}
							</option>
						))}
					</select>
				) : null}
			</div>
		);
	}

	if (target) {
		return (
			<select
				className="ln-input"
				value={questionMode}
				aria-label="Cách nhập"
				onChange={(event) => onQuestionMode(event.target.value as 'append' | 'replace')}
			>
				<option value="append">Thêm vào sau {target.count} câu hiện có</option>
				<option value="replace">Thay toàn bộ câu hỏi</option>
			</select>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<label className="flex items-center gap-2 text-sm">
				Tạo mục mới trong bài
				<select
					className="ln-input"
					value={lessonId}
					aria-label="Bài nhận mục"
					onChange={(event) => onLessonId(event.target.value)}
				>
					{lessons.map((lesson) => (
						<option key={lesson.id} value={lesson.id}>
							{lesson.title}
						</option>
					))}
				</select>
			</label>
			<label className="flex items-center gap-2 text-sm">
				Tên mục
				<input
					className="ln-input"
					value={sectionTitle}
					aria-label="Tên mục"
					maxLength={200}
					onChange={(event) => onSectionTitle(event.target.value)}
				/>
			</label>
		</div>
	);
}
