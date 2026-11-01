'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { countWords, estimateReadingMinutes } from '@/features/learn/content';
import { addImageSlots } from '@/features/learn/imageHints';
import { findImageRefs, imageFileKey, replaceImageSrcs } from '@/features/learn/images';

import ImageHintsBar from './ImageHintsBar';
import ImageUploadStatus from './ImageUploadStatus';
import { StudioIcon } from './icons';
import {
	droppedImageFiles,
	matchImageFiles,
	pastedHtmlHasText,
	uploadImageAt,
} from './imageUploadUtils';
import MissingImagesBar from './MissingImagesBar';
import { useImageUploads } from './useImageUploads';

const PREVIEW_KEY = 'ln-md-preview';

function readPreviewShown(): boolean {
	try {
		return window.localStorage.getItem(PREVIEW_KEY) !== 'off';
	} catch {
		return true;
	}
}

function isImage(file: File) {
	return file.type.startsWith('image/');
}

/**
 * The one editor in Learn Studio: Markdown source beside a learner preview.
 * Images are pasted, dropped or picked per slot; nothing else sits between the author and the text.
 */
export default function MarkdownEditor({
	value,
	onChange,
	onOpenHelp,
	label = 'Nội dung Markdown',
	placeholder = '## Tiêu đề\n\nNội dung…\n\n> [!DEFINITION] Khái niệm\n> Định nghĩa…',
	renderPreview = (markdown) => <LearnMarkdown markdown={markdown} showMissingImages />,
	showPreview = true,
	showCount = true,
	notice,
}: {
	value: string;
	onChange: (markdown: string) => void;
	onOpenHelp?: () => void;
	label?: string;
	placeholder?: string;
	renderPreview?: (markdown: string) => ReactNode;
	/** Short fields such as a lead-in skip the side preview. */
	showPreview?: boolean;
	showCount?: boolean;
	/** Shown above the source, e.g. parse warnings for a question bank. */
	notice?: ReactNode;
}) {
	const [source, setSource] = useState(value);
	const sourceRef = useRef(value);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);
	const uploads = useImageUploads();
	const [note, setNote] = useState('');
	const [reading, setReading] = useState(false);
	const [previewShown, setPreviewShown] = useState(showPreview);
	useEffect(() => {
		if (!showPreview) return;
		// The remembered choice is only readable after hydration.
		setPreviewShown(readPreviewShown());
	}, [showPreview]);

	function change(next: string) {
		sourceRef.current = next;
		setSource(next);
		onChangeRef.current(next);
	}

	function togglePreview() {
		const next = !previewShown;
		setPreviewShown(next);
		try {
			window.localStorage.setItem(PREVIEW_KEY, next ? 'on' : 'off');
		} catch {
			// Storage blocked: the toggle still works for this visit.
		}
	}

	/** Keep the preview at the same relative position as the source while scrolling. */
	function syncPreview(area: HTMLTextAreaElement) {
		const preview = previewRef.current;
		if (!preview) return;
		const range = area.scrollHeight - area.clientHeight;
		const ratio = range > 0 ? area.scrollTop / range : 0;
		preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
	}

	/** New pictures go in at the caret as placeholders, then swap to their uploaded URL. */
	async function insertFiles(files: File[]) {
		const placeholders = files.map((file) => ({
			file,
			src: `anh-dan-${crypto.randomUUID()}-${encodeURIComponent(file.name)}`,
		}));
		const current = sourceRef.current;
		const start = textareaRef.current?.selectionStart ?? current.length;
		const end = textareaRef.current?.selectionEnd ?? start;
		change(
			current.slice(0, start) +
				'\n' +
				placeholders.map(({ src }) => `![](${src})`).join('\n') +
				'\n' +
				current.slice(end),
		);
		await Promise.all(
			placeholders.map(async ({ file, src }) => {
				const url = await uploads.uploadFile(file);
				if (url) change(replaceImageSrcs(sourceRef.current, new Map([[src, url]])));
			}),
		);
	}

	/** Files named like a missing image (hinh-1.png) fill that slot instead of adding a new one. */
	async function attachFiles(files: File[]) {
		const { replacements, unmatched, count } = await matchImageFiles(
			findImageRefs(sourceRef.current),
			files,
			uploads.uploadFile,
		);
		change(replaceImageSrcs(sourceRef.current, replacements));
		setNote(
			`Đã gắn ${count} ảnh${unmatched.length ? ` · ${unmatched.length} file không khớp: ${unmatched.join(', ')}` : ''}`,
		);
	}

	function dropFiles(files: File[]) {
		const refs = findImageRefs(sourceRef.current);
		const fillsSlot = files.some((file) =>
			refs.some(
				(ref) => ref.status !== 'ready' && imageFileKey(ref.url) === imageFileKey(file.name),
			),
		);
		if (fillsSlot) void attachFiles(files);
		else void insertFiles(files);
	}

	const busy = reading || uploads.uploading;
	const withPreview = showPreview && previewShown;

	return (
		<div
			className="ln-editor"
			onDragOverCapture={(event) => {
				if (event.dataTransfer.types.includes('Files')) event.preventDefault();
			}}
			onDropCapture={(event) => {
				const folder = [...(event.dataTransfer.items ?? [])].some(
					(item) => item.webkitGetAsEntry?.()?.isDirectory,
				);
				if (!folder) return;
				event.preventDefault();
				event.stopPropagation();
				setReading(true);
				void droppedImageFiles(event.dataTransfer)
					.then((files) => attachFiles(files))
					.catch(() => setNote('Không đọc được thư mục ảnh. Hãy chọn các file ảnh.'))
					.finally(() => setReading(false));
			}}
		>
			<div className="ln-editor__bar">
				{showCount ? (
					<span className="ln-editor__count tabular-nums">
						{countWords(source).toLocaleString('vi-VN')} từ · ~{estimateReadingMinutes(source)} phút
						đọc
					</span>
				) : null}
				<span className="ln-editor__spacer" />
				<button
					type="button"
					className="ln-mdbar__btn"
					disabled={busy}
					onClick={() => fileRef.current?.click()}
				>
					<StudioIcon name="image" size={14} /> Thêm ảnh
				</button>
				{onOpenHelp ? (
					<button type="button" className="ln-mdbar__btn" onClick={onOpenHelp}>
						<StudioIcon name="help" size={14} /> Cú pháp
					</button>
				) : null}
				{showPreview ? (
					<button
						type="button"
						className="ln-mdbar__btn"
						aria-pressed={previewShown}
						onClick={togglePreview}
					>
						<StudioIcon name="eye" size={14} /> {previewShown ? 'Ẩn xem trước' : 'Xem trước'}
					</button>
				) : null}
			</div>
			<ImageHintsBar
				markdown={source}
				disabled={busy}
				onAdd={() => change(addImageSlots(sourceRef.current))}
			/>
			<MissingImagesBar
				markdown={source}
				disabled={busy}
				onFiles={(files) => void attachFiles(files)}
				onReplace={(index, file) =>
					void uploadImageAt(index, file, () => sourceRef.current, change, uploads.uploadFile)
				}
			/>
			<ImageUploadStatus uploads={uploads} />
			{note ? (
				<p className="ln-editor__upload" role="status">
					{note}
				</p>
			) : null}
			{notice}
			<div className="ln-editor__split" data-preview={withPreview ? 'true' : 'false'}>
				<textarea
					ref={textareaRef}
					aria-label={label}
					className="ln-editor__source"
					value={source}
					spellCheck={false}
					placeholder={placeholder}
					onScroll={(event) => syncPreview(event.currentTarget)}
					onChange={(event) => change(event.target.value)}
					onPaste={(event) => {
						const files = [...event.clipboardData.files].filter(isImage);
						if (files.length && !pastedHtmlHasText(event.clipboardData.getData('text/html'))) {
							event.preventDefault();
							void insertFiles(files);
						}
					}}
					onDrop={(event) => {
						const files = [...event.dataTransfer.files].filter(isImage);
						if (!files.length) return;
						event.preventDefault();
						dropFiles(files);
					}}
				/>
				{withPreview ? (
					<div
						ref={previewRef}
						className="ln-editor__preview"
						role="region"
						aria-label="Xem trước như học viên"
					>
						<p className="ln-editor__preview-label">Xem trước như học viên</p>
						{renderPreview(source)}
					</div>
				) : null}
			</div>
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				multiple
				hidden
				onChange={(event) => {
					const files = [...(event.target.files ?? [])];
					event.target.value = '';
					if (files.length) void insertFiles(files);
				}}
			/>
		</div>
	);
}
