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
import { onTabListKeyDown } from './StudioTabs';
import { ManualCopyField, useCopy } from './useCopy';

function quotedTitles(items: Array<{ title: string }>) {
	const names = items.map((item) => `“${item.title.trim() || 'mục không tên'}”`);
	if (names.length <= 4) return names.join(', ');
	return `${names.slice(0, 4).join(', ')} và ${names.length - 4} mục khác`;
}

function importImpact(input: {
	kind: AiImportKind;
	contentReady: boolean;
	lessonMode: 'create' | 'replace';
	questionMode: 'append' | 'replace';
	lessonName: string;
	sectionName: string;
	sectionTitle: string;
	lessonCount: number;
	questionCount: number;
	existingQuestions: number;
	hasTarget: boolean;
	updates: number;
	creates: number;
	deletes: number;
}) {
	if (input.kind === 'lesson' && input.lessonMode === 'create') {
		return input.contentReady
			? `Tạo bài mới với ${input.lessonCount} mục.`
			: 'Tạo bài mới. Dán nội dung để xem số mục.';
	}
	if (input.kind === 'lesson') {
		if (!input.contentReady) {
			return `Thay nội dung bài “${input.lessonName}”. Dán nội dung để xem mục nào được giữ hoặc xóa.`;
		}
		const bits = [`${input.updates} mục được ghi lại`];
		if (input.creates) bits.push(`${input.creates} mục mới`);
		if (input.deletes) bits.push(`${input.deletes} mục bị xóa`);
		return `Thay bài “${input.lessonName}”: ${bits.join(', ')}.`;
	}
	if (input.hasTarget && input.questionMode === 'append') {
		return input.contentReady
			? `Thêm ${input.questionCount} câu vào sau ${input.existingQuestions} câu hiện có trong “${input.sectionName}”.`
			: `Thêm câu vào sau ${input.existingQuestions} câu hiện có trong “${input.sectionName}”.`;
	}
	if (input.hasTarget) {
		return input.contentReady
			? `Thay ${input.existingQuestions} câu hiện có trong “${input.sectionName}” bằng ${input.questionCount} câu vừa dán.`
			: `Thay ${input.existingQuestions} câu hiện có trong “${input.sectionName}”.`;
	}
	const title = input.sectionTitle.trim() || DEFAULT_SECTION_TITLE;
	return input.contentReady
		? `Tạo mục “${title}” trong “${input.lessonName}” với ${input.questionCount} câu.`
		: `Tạo mục phản biện mới trong “${input.lessonName}”.`;
}

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
	const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
	const targetSection = target
		? lessons.flatMap((lesson) => lesson.sections).find((item) => item.id === target.sectionId)
		: undefined;
	const replacePlan = useMemo(() => {
		if (kind !== 'lesson' || lessonMode !== 'replace' || !lessonParsed || !selectedLesson)
			return null;
		return planContentReplace(
			selectedLesson.sections.map((item) => ({ id: item.id, title: item.title })),
			lessonParsed.lessons.flatMap((lesson) => lesson.sections),
		);
	}, [kind, lessonMode, lessonParsed, selectedLesson]);

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
		if (replacePlan && replacePlan.deletes.length > 0) {
			const names = quotedTitles(replacePlan.deletes);
			const accepted = await confirm({
				title: `Xóa ${replacePlan.deletes.length} mục khỏi “${selectedLesson?.title ?? 'bài đã chọn'}”?`,
				body: `${names} không còn trong bản dán. Các mục này và tiến độ học viên trên đó sẽ mất. ${replacePlan.updates.length} mục được giữ và cập nhật${
					replacePlan.creates.length ? `, ${replacePlan.creates.length} mục được thêm` : ''
				}.`,
				confirmLabel: 'Thay và xóa',
				danger: true,
			});
			if (!accepted) return;
		}
		if (kind === 'discussion' && target && questionMode === 'replace' && target.count > 0) {
			const where = targetSection?.title ?? 'mục đang mở';
			const accepted = await confirm({
				title: `Thay ${target.count} câu trong “${where}”?`,
				body: `${target.count} câu hiện có sẽ bị thay bằng ${questionCount} câu vừa dán.`,
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
	const lessonName = selectedLesson?.title ?? 'bài đã chọn';
	const sectionName = targetSection?.title ?? 'mục đang mở';
	const destination =
		kind === 'lesson'
			? lessonMode === 'create'
				? 'bài mới'
				: `bài “${lessonName}”`
			: target
				? `mục “${sectionName}”`
				: `mục mới trong bài “${lessonName}”`;
	const removedCount = replacePlan?.deletes.length ?? 0;
	const impact = importImpact({
		kind,
		contentReady,
		lessonMode,
		questionMode,
		lessonName,
		sectionName,
		sectionTitle,
		lessonCount: lessonSections.length,
		questionCount,
		existingQuestions: target?.count ?? 0,
		hasTarget: Boolean(target),
		updates: replacePlan?.updates.length ?? 0,
		creates: replacePlan?.creates.length ?? 0,
		deletes: removedCount,
	});

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
					<div className="ln-import-target">
						<p>
							Đích: {courseTitle} → {destination}
						</p>
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
						<p id="ln-import-impact">{impact}</p>
						{report ? <ImportSummary count={count} unit={unit} report={report} /> : null}
					</div>
					<details className="ln-import-help">
						<summary>Dùng AI để định dạng (tùy chọn)</summary>
						<p>
							Chép prompt, đưa cho AI cùng {kind === 'lesson' ? 'bài giảng gốc' : 'câu hỏi gốc'},
							rồi dán kết quả vào ô bên dưới. Có thể bỏ qua bước này nếu nội dung đã theo mẫu.
						</p>
						<button type="button" className="ln-link-btn" onClick={() => void copyPrompt()}>
							<StudioIcon name="copy" size={14} />{' '}
							{copied || promptCopied ? 'Đã chép prompt' : 'Chép prompt định dạng'}
						</button>
						{manual ? <ManualCopyField text={manual} /> : null}
					</details>
					<div
						className="ln-segmented ln-split__switch self-start"
						role="tablist"
						aria-label="Khung"
						onKeyDown={onTabListKeyDown}
					>
						<button
							type="button"
							role="tab"
							aria-selected={pane === 'paste'}
							tabIndex={pane === 'paste' ? 0 : -1}
							onClick={() => setPane('paste')}
						>
							Dán
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={pane === 'preview'}
							tabIndex={pane === 'preview' ? 0 : -1}
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
						aria-label="Nội dung dán"
						aria-describedby="ln-import-impact"
						aria-invalid={report?.errors ? true : undefined}
						value={text}
						onChange={(event) => setText(event.target.value)}
						onPaste={() => setPane('preview')}
						spellCheck={false}
						placeholder={
							kind === 'lesson'
								? 'Dán bài giảng: bắt đầu bằng dòng # Tên bài, mỗi mục mở bằng === SECTION: … ==='
								: 'Dán câu phản biện: mỗi câu mở bằng dòng "Câu 1:", đề bài, rồi dòng "Đáp án mẫu:"'
						}
					/>
					<div className="ln-preview" aria-label="Xem như học viên">
						<p className="ln-preview__label">Xem như học viên</p>
						<ImportImagePicker markdown={text} onChange={setText} onBusyChange={setUploadBusy} />
						{removedCount > 0 ? (
							<p className="ln-warning">
								{quotedTitles(replacePlan?.deletes ?? [])} sẽ bị xóa, cùng tiến độ học viên trên các
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
