'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { estimateReadingMinutes, formatMinutes } from '@/features/learn/content';
import { parseDiscussionPaste } from '@/features/learn/discussionImport';
import {
	cleanAiPaste,
	parseCourseMarkdown,
	planContentReplace,
} from '@/features/learn/lessonImport';
import { LEARN_FORMAT_PROMPTS } from '@/features/learn/prompts';
import { parseQuizPaste } from '@/features/learn/quizImport';
import { LEARN_MAX_MARKDOWN } from '@/features/learn/schemas';
import {
	LEARN_SECTION_KIND_SHORT,
	type LearnDiscussionQuestion,
	type LearnQuizQuestion,
	type LearnStudioLesson,
} from '@/features/learn/types';

import { StudioIcon } from './icons';
import StudioDialog from './StudioDialog';
import ImportImagePicker from './ImportImagePicker';
import { ManualCopyField, useCopy } from './useCopy';

export type AiImportKind = 'lesson' | 'quiz' | 'practice' | 'discussion';

const KIND_OPTIONS: Array<{ id: AiImportKind; label: string }> = [
	{ id: 'lesson', label: 'Bài học' },
	{ id: 'quiz', label: 'Kiểm tra' },
	{ id: 'practice', label: 'Luyện tập' },
	{ id: 'discussion', label: 'Phản biện' },
];

const DEFAULT_SECTION_TITLE: Record<Exclude<AiImportKind, 'lesson'>, string> = {
	quiz: 'Bài kiểm tra',
	practice: 'Luyện tập',
	discussion: 'Câu hỏi phản biện',
};

export type AiImportInput =
	| {
			kind: 'lesson';
			markdown: string;
			mode: 'create' | 'replace';
			lessonId?: string;
	  }
	| {
			kind: 'quiz' | 'practice';
			mode: 'create';
			lessonId: string;
			title: string;
			questions: LearnQuizQuestion[];
	  }
	| {
			kind: 'quiz' | 'practice';
			mode: 'append' | 'replace';
			sectionId: string;
			questions: LearnQuizQuestion[];
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

function promptKey(kind: AiImportKind): keyof typeof LEARN_FORMAT_PROMPTS {
	return kind === 'practice' ? 'quiz' : kind;
}

export default function AiImportDialog({
	kind: initialKind,
	lockKind = false,
	lessons,
	selectedLessonId,
	target,
	onSave,
	onClose,
}: {
	kind: AiImportKind;
	lockKind?: boolean;
	lessons: LearnStudioLesson[];
	selectedLessonId: string | null;
	target?: { sectionId: string; count: number };
	onSave: (input: AiImportInput) => Promise<void>;
	onClose: () => void;
}) {
	const [kind, setKind] = useState<AiImportKind>(initialKind);
	const [text, setText] = useState('');
	const [lessonMode, setLessonMode] = useState<'create' | 'replace'>('create');
	const [questionMode, setQuestionMode] = useState<'append' | 'replace'>('append');
	const [lessonId, setLessonId] = useState(selectedLessonId ?? lessons[0]?.id ?? '');
	const [sectionTitle, setSectionTitle] = useState(
		DEFAULT_SECTION_TITLE[initialKind === 'lesson' ? 'quiz' : initialKind],
	);
	const [titleTouched, setTitleTouched] = useState(false);
	const [uploadBusy, setUploadBusy] = useState(false);
	const [busy, setBusy] = useState(false);
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
	const quizParsed = useMemo(
		() => (kind === 'quiz' || kind === 'practice' ? parseQuizPaste(cleaned?.markdown ?? '') : null),
		[kind, cleaned],
	);
	const discussionParsed = useMemo(
		() => (kind === 'discussion' ? parseDiscussionPaste(cleaned?.markdown ?? '') : null),
		[kind, cleaned],
	);

	const lessonSections = lessonParsed?.lessons.flatMap((lesson) => lesson.sections) ?? [];
	const oversized = lessonSections.some((section) => section.markdown.length > LEARN_MAX_MARKDOWN);
	const questionCount =
		kind === 'discussion'
			? (discussionParsed?.questions.length ?? 0)
			: (quizParsed?.questions.length ?? 0);
	const missingAnswers = new Set(quizParsed?.missingAnswer ?? []);
	const deletedCount = useMemo(() => {
		if (kind !== 'lesson' || lessonMode !== 'replace' || !cleaned) return 0;
		const current = lessons.find((lesson) => lesson.id === lessonId);
		if (!current) return 0;
		const incoming = parseCourseMarkdown(cleaned.markdown).lessons.flatMap(
			(lesson) => lesson.sections,
		);
		return planContentReplace(current.sections, incoming).deletes.length;
	}, [kind, lessonMode, lessons, lessonId, cleaned]);

	const canSave =
		kind === 'lesson'
			? lessonSections.length > 0 && !oversized && (lessonMode === 'create' || Boolean(lessonId))
			: questionCount > 0 && (target ? true : Boolean(lessonId) && sectionTitle.trim().length > 0);

	function changeKind(next: AiImportKind) {
		setKind(next);
		setError(null);
		if (next !== 'lesson' && !titleTouched) setSectionTitle(DEFAULT_SECTION_TITLE[next]);
	}

	async function submit() {
		if (uploadBusy || busy) return;
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
			if (kind === 'discussion') {
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
				return;
			}
			const questions = quizParsed?.questions ?? [];
			await onSave(
				target
					? { kind, mode: questionMode, sectionId: target.sectionId, questions }
					: { kind, mode: 'create', lessonId, title: sectionTitle.trim(), questions },
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được nội dung');
			setBusy(false);
		}
	}

	const saveLabel =
		kind === 'lesson' ? `Lưu ${lessonSections.length} mục` : `Lưu ${questionCount} câu`;
	const warnings = [
		...(cleaned?.warnings ?? []),
		...(lessonParsed?.warnings ?? []),
		...(quizParsed?.warnings ?? []),
		...(discussionParsed?.warnings ?? []),
	];

	return (
		<StudioDialog
			title="Nhập bằng AI"
			onClose={onClose}
			footer={
				<>
					{error ? (
						<p className="mr-auto text-sm text-error" role="alert">
							{error}
						</p>
					) : null}
					<button type="button" className="ln-btn" onClick={onClose} disabled={busy}>
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
			<div className="mb-3 flex flex-col gap-2">
				{lockKind ? null : (
					<div className="ln-segmented" role="radiogroup" aria-label="Loại nội dung">
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
				<button
					type="button"
					className="ln-link-btn self-start"
					onClick={() => void copy(LEARN_FORMAT_PROMPTS[promptKey(kind)])}
				>
					<StudioIcon name="copy" size={14} /> {copied ? 'Đã chép prompt' : 'Chép prompt định dạng'}
				</button>
				{manual ? <ManualCopyField text={manual} /> : null}
				<p className="text-sm text-ink-secondary">
					Dán vào ChatGPT, Claude hoặc Gemini, thêm tài liệu, gửi, rồi dán câu trả lời vào đây.
				</p>
			</div>
			<div className="ln-split">
				<div className="flex min-h-0 flex-col gap-2">
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
						onSectionTitle={(value) => {
							setTitleTouched(true);
							setSectionTitle(value);
						}}
					/>
					<textarea
						autoFocus
						className="ln-editor__source min-h-[22rem] flex-1"
						aria-label="Kết quả AI"
						value={text}
						onChange={(event) => setText(event.target.value)}
						spellCheck={false}
						placeholder="Dán kết quả AI vào đây."
					/>
				</div>
				<div className="ln-preview">
					<p className="ln-preview__label">Xem trước</p>
					<ImportImagePicker markdown={text} onChange={setText} onBusyChange={setUploadBusy} />
					{warnings.map((warning) => (
						<p key={warning} className="ln-warning">
							{warning}
						</p>
					))}
					{kind === 'lesson' &&
					lessonParsed &&
					(lessonParsed.lessons.length ?? 0) > 1 &&
					lessonMode === 'replace' ? (
						<p className="ln-warning">Có nhiều dòng # — chế độ này sẽ gộp nhiều bài vào một bài.</p>
					) : null}
					{deletedCount > 0 ? (
						<p className="ln-warning">Học viên sẽ mất tiến độ trên các mục bị xóa.</p>
					) : null}
					{kind === 'lesson' ? (
						lessonParsed ? (
							<>
								{lessonParsed.lessons.map((lesson) => (
									<div key={lesson.lessonTitle}>
										<p className="font-display text-xl font-medium">{lesson.lessonTitle}</p>
										{lesson.lessonDescription ? (
											<p className="mt-1 text-sm text-ink-secondary">{lesson.lessonDescription}</p>
										) : null}
									</div>
								))}
								<ol className="ln-preview__sections">
									{lessonSections.map((section, index) => (
										<li key={index}>
											<span className="ln-preview__index tabular-nums">{index + 1}</span>
											<span className="min-w-0 flex-1">
												<span className="block font-medium">
													{section.type !== 'READING'
														? `${LEARN_SECTION_KIND_SHORT[section.type]} · `
														: ''}
													{section.title}
												</span>
												{section.summary ? (
													<span className="block text-sm text-ink-secondary">
														{section.summary}
													</span>
												) : null}
											</span>
											<span className="text-xs text-ink-secondary tabular-nums">
												{section.type === 'QUIZ' || section.type === 'PRACTICE'
													? `${section.quiz?.questions.length ?? 0} câu`
													: section.type === 'DISCUSSION'
														? `${section.discussion?.questions.length ?? 0} câu`
														: `${section.wordCount} từ · ${formatMinutes(section.durationMinutes ?? estimateReadingMinutes(section.markdown))}`}
											</span>
										</li>
									))}
								</ol>
							</>
						) : (
							<p className="text-sm text-ink-secondary">
								Các mục sẽ hiện ở đây khi bạn dán nội dung.
							</p>
						)
					) : kind === 'discussion' ? (
						discussionParsed && discussionParsed.questions.length ? (
							<ol className="ln-preview__list">
								{discussionParsed.questions.map((question, index) => (
									<li key={question.id}>
										<p className="font-medium">Câu {index + 1}</p>
										{question.question ? (
											<LearnMarkdown markdown={question.question} showMissingImages />
										) : (
											<p>
												<em>(chưa có câu hỏi)</em>
											</p>
										)}
										{question.answer ? (
											<LearnMarkdown markdown={question.answer} showMissingImages />
										) : (
											<p className="ln-warning">Thiếu đáp án mẫu</p>
										)}
									</li>
								))}
							</ol>
						) : (
							<p className="text-sm text-ink-secondary">
								Các câu sẽ hiện ở đây khi bạn dán nội dung.
							</p>
						)
					) : quizParsed && quizParsed.questions.length ? (
						<ol className="ln-preview__list">
							{quizParsed.questions.map((question, index) => (
								<li
									key={question.id}
									data-missing={missingAnswers.has(question.id) ? 'true' : undefined}
								>
									<p className="font-medium">
										{index + 1}. {question.question || <em>(chưa có câu hỏi)</em>}
										{missingAnswers.has(question.id) ? (
											<span className="ln-warning"> · thiếu đáp án</span>
										) : null}
									</p>
									<ul>
										{question.options.map((option, optionIndex) => (
											<li
												key={optionIndex}
												data-correct={
													!missingAnswers.has(question.id) && optionIndex === question.correctIndex
														? 'true'
														: undefined
												}
											>
												{'ABCDEFGH'[optionIndex]}. {option}
											</li>
										))}
									</ul>
								</li>
							))}
						</ol>
					) : (
						<p className="text-sm text-ink-secondary">
							Các câu sẽ hiện ở đây khi bạn dán nội dung.
						</p>
					)}
				</div>
			</div>
		</StudioDialog>
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
