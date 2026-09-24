'use client';

import { useMemo, useState } from 'react';

import { formatMinutes, estimateReadingMinutes } from '@/features/learn/content';
import { autoSectionRawText, parseLessonMarkdown } from '@/features/learn/lessonImport';
import { LEARN_MARKDOWN_GUIDE, LEARN_REFORMAT_PROMPT } from '@/features/learn/prompts';
import { LEARN_MAX_MARKDOWN } from '@/features/learn/schemas';

import { StudioIcon } from './icons';
import StudioDialog from './StudioDialog';
import { useCopy } from './useCopy';

export default function ImportLessonDialog({
	onClose,
	onImport,
}: {
	onClose: () => void;
	onImport: (markdown: string) => Promise<void>;
}) {
	const [text, setText] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [guideOpen, setGuideOpen] = useState(false);
	const parsed = useMemo(() => (text.trim() ? parseLessonMarkdown(text) : null), [text]);
	const { copied, copy } = useCopy();
	const oversized = parsed?.sections.some((section) => section.markdown.length > LEARN_MAX_MARKDOWN) ?? false;

	async function submit() {
		setBusy(true);
		setError(null);
		try {
			await onImport(text);
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
						disabled={busy || !parsed?.sections.length || oversized}
						onClick={submit}
					>
						{busy ? 'Đang nhập…' : `Nhập ${parsed?.sections.length ?? 0} mục`}
					</button>
				</>
			}
		>
			<div className="ln-split">
				<div className="flex min-h-0 flex-col gap-2">
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
							<p className="font-display text-xl font-medium">{parsed.lessonTitle}</p>
							{parsed.lessonDescription ? (
								<p className="mt-1 text-sm text-ink-secondary">{parsed.lessonDescription}</p>
							) : null}
							{parsed.warnings.map((warning) => (
								<p key={warning} className="ln-warning">
									{warning}
								</p>
							))}
							<ol className="ln-preview__sections">
								{parsed.sections.map((section, index) => (
									<li key={index}>
										<span className="ln-preview__index tabular-nums">{index + 1}</span>
										<span className="min-w-0 flex-1">
											<span className="block font-medium">{section.title}</span>
											{section.summary ? (
												<span className="block text-sm text-ink-secondary">{section.summary}</span>
											) : null}
										</span>
										<span className="text-xs text-ink-secondary tabular-nums">
											{section.wordCount} từ ·{' '}
											{formatMinutes(section.durationMinutes ?? estimateReadingMinutes(section.markdown))}
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
