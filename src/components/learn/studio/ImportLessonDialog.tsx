'use client';

import { useMemo, useState } from 'react';

import { formatMinutes, estimateReadingMinutes } from '@/features/learn/content';
import { autoSectionRawText, parseCourseMarkdown, planContentReplace, type ImportedSection } from '@/features/learn/lessonImport';
import { LEARN_MARKDOWN_GUIDE, LEARN_REFORMAT_PROMPT } from '@/features/learn/prompts';
import { LEARN_MAX_MARKDOWN } from '@/features/learn/schemas';

import { StudioIcon } from './icons';
import StudioDialog from './StudioDialog';
import { useCopy } from './useCopy';

export default function ImportLessonDialog({
	lessons,
	selectedLessonId,
	onClose,
	onImport,
}: {
	lessons: Array<{ id: string; title: string; sections: Array<{ id: string; title: string }> }>;
	selectedLessonId: string | null;
	onClose: () => void;
	onImport: (input: { markdown: string; mode: 'create' | 'append' | 'replace'; lessonId?: string }) => Promise<void>;
}) {
	const [text, setText] = useState('');
	const [mode, setMode] = useState<'create' | 'append' | 'replace'>('create');
	const [lessonId, setLessonId] = useState(selectedLessonId ?? lessons[0]?.id ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [guideOpen, setGuideOpen] = useState(false);
	const parsed = useMemo(() => (text.trim() ? parseCourseMarkdown(text) : null), [text]);
	const { copied, copy } = useCopy();
	const sections = parsed?.lessons.flatMap((lesson) => lesson.sections) ?? [];
	const oversized = sections.some((section) => section.markdown.length > LEARN_MAX_MARKDOWN);
	const target = lessons.find((lesson) => lesson.id === lessonId);
	const replacePlan =
		mode === 'replace' && target ? planContentReplace(target.sections, sections as ImportedSection[]) : null;

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

	return (
		<StudioDialog
			title="Nhập bài học từ Markdown"
			onClose={onClose}
			footer={
				<>
					{error ? <p className="mr-auto text-sm text-error">{error}</p> : null}
					<button type="button" className="ln-btn" onClick={onClose}>
						Hủy
					</button>
					<button
						type="button"
						className="ln-btn ln-btn--primary"
						disabled={busy || !sections.length || oversized || (mode !== 'create' && !lessonId)}
						onClick={submit}
					>
						{busy ? 'Đang nhập…' : `Nhập ${sections.length} mục`}
					</button>
				</>
			}
		>
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
						<button type="button" className="ln-link-btn" onClick={() => copy(LEARN_REFORMAT_PROMPT)}>
							<StudioIcon name="copy" size={14} /> {copied ? 'Đã chép prompt' : 'Chép prompt AI định dạng bài'}
						</button>
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
						value={text}
						onChange={(event) => setText(event.target.value)}
						spellCheck={false}
						placeholder={
							'Dán bài giảng ở đây.\n\nĐã có dấu "=== SECTION: … ===" thì nhập ngay.\nChỉ là văn bản thường: bấm "Tự chia mục theo đề mục", hoặc chép prompt AI để định dạng trước.'
						}
					/>
				</div>
				<div className="ln-preview">
					<p className="ln-preview__label">Xem trước</p>
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
							{replacePlan ? (
								<p className="ln-warning">
									Thêm {replacePlan.creates.length} mục, sửa {replacePlan.updates.length} mục, xóa {replacePlan.deletes.length} mục.
									{replacePlan.deletes.length
										? ' Mục bị xóa sẽ mất tiến độ và ghi chú của học viên.'
										: ' Mục trùng tên được cập nhật tại chỗ, tiến độ học viên giữ nguyên.'}
								</p>
							) : null}
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
						</>
					) : (
						<p className="text-sm text-ink-secondary">Các mục sẽ hiện ở đây khi bạn dán nội dung.</p>
					)}
				</div>
			</div>
		</StudioDialog>
	);
}
