'use client';

import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
	countWords,
	estimateReadingMinutes,
	normalizeEditorMarkdown,
} from '@/features/learn/content';
import {
	findImageRefs,
	imageFileKey,
	splitImageSrc,
	replaceImageSrcs,
} from '@/features/learn/images';
import { findUnsupportedMarkdown } from '@/features/learn/markdownFidelity';
import { compareLectureText, type TextHunk } from '@/features/learn/textFidelity';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { useImageUploads } from './useImageUploads';
import ImageUploadStatus from './ImageUploadStatus';
import { markdownFromPaste } from './markdownPaste';
import MissingImagesBar from './MissingImagesBar';
import {
	uploadImageAt,
	droppedImageFiles,
	matchImageFiles,
	replaceEditorImages,
	insertImageFiles,
	pastedHtmlHasText,
	preparePastedImages,
	resolvePastedImages,
} from './imageUploadUtils';

import { learnEditorExtensions } from './editorExtensions';
import { registerEditorFlush } from './useStudioSaver';
import TextDiff from './TextDiff';
import { StudioIcon } from './icons';
import { onTabListKeyDown } from './StudioTabs';
import { filterSlashCommands, type SlashCommand } from './slashCommands';

import EditorToolbar from './EditorToolbar';
import MarkdownInsertBar from './MarkdownInsertBar';
import SlashMenu, { type SlashState } from './SlashMenu';

type Mode = 'visual' | 'markdown';

/**
 * WYSIWYG section editor that reads and writes NDK markdown. A Markdown tab exposes the
 * raw source for pasting AI output; both views stay in sync.
 */
const PREVIEW_KEY = 'ln-md-preview';

function readPreviewShown(): boolean {
	try {
		return window.localStorage.getItem(PREVIEW_KEY) !== 'off';
	} catch {
		return true;
	}
}

export default function LearnRichEditor({
	value,
	onChange,
	onOpenHelp,
	markdownPreview = true,
	defaultMode = 'visual',
	label = 'Nội dung Markdown',
	bindInsert,
}: {
	value: string;
	onChange: (markdown: string) => void;
	onOpenHelp?: () => void;
	/** The lecture editor can show Markdown beside its source. A question field uses a separate preview. */
	markdownPreview?: boolean;
	defaultMode?: Mode;
	label?: string;
	/** Lets a parent insert a snippet at the caret without mounting a second editor. */
	bindInsert?: (insert: ((snippet: string) => void) | null) => void;
}) {
	const [previewShown, setPreviewShown] = useState(markdownPreview);
	const previewRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!markdownPreview) return;
		// The remembered choice is only readable after hydration.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPreviewShown(readPreviewShown());
	}, [markdownPreview]);
	function togglePreview() {
		const next = !previewShown;
		setPreviewShown(next);
		try {
			window.localStorage.setItem(PREVIEW_KEY, next ? 'on' : 'off');
		} catch {
			// Storage blocked: the toggle still works for this visit.
		}
	}
	/** Keep the preview at the same relative position as the source while typing or scrolling. */
	function syncPreview(area: HTMLTextAreaElement) {
		const preview = previewRef.current;
		if (!preview) return;
		const range = area.scrollHeight - area.clientHeight;
		const ratio = range > 0 ? area.scrollTop / range : 0;
		preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
	}
	const [mode, setMode] = useState<Mode>(() =>
		findUnsupportedMarkdown(value).length ? 'markdown' : defaultMode,
	);
	const [source, setSource] = useState(value);
	const [modeWarning, setModeWarning] = useState<string[] | null>(() => {
		const unsupported = findUnsupportedMarkdown(value);
		return unsupported.length ? unsupported : null;
	});
	const [lossHunks, setLossHunks] = useState<TextHunk[] | null>(null);
	const uploads = useImageUploads();
	const [attachmentNote, setAttachmentNote] = useState('');
	const [readingFiles, setReadingFiles] = useState(false);
	const [processingPaste, setProcessingPaste] = useState(false);
	const pasteJobs = useRef(0);
	const attachRef = useRef<(files: File[]) => void>(() => {});
	const pastedImages = useRef(new Map<string, string>());
	const insertRef = useRef<(files: File[], position?: number) => void>(() => {});
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const sourceRef = useRef(source);
	useEffect(() => {
		sourceRef.current = source;
	}, [source]);
	const [slash, setSlash] = useState<SlashState | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const uploadRef = useRef<(file: File, apply?: (url: string) => void) => void>(() => {});
	const slashRef = useRef<SlashState | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const onChangeRef = useRef(onChange);
	const latestMarkdown = useRef(value);
	const editorRef = useRef<Editor | null>(null);
	const dirtyRef = useRef(false);
	const dirtyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const readPending = useRef<(() => string) | null>(null);

	const flushPending = useCallback(() => {
		if (!dirtyRef.current || !readPending.current) return;
		dirtyRef.current = false;
		if (dirtyTimer.current) {
			clearTimeout(dirtyTimer.current);
			dirtyTimer.current = null;
		}
		const markdown = readPending.current();
		readPending.current = null;
		latestMarkdown.current = markdown;
		onChangeRef.current(markdown);
	}, []);

	const scheduleChange = useCallback(
		(read: () => string) => {
			readPending.current = read;
			dirtyRef.current = true;
			if (dirtyTimer.current) clearTimeout(dirtyTimer.current);
			dirtyTimer.current = setTimeout(() => {
				dirtyTimer.current = null;
				flushPending();
			}, 300);
		},
		[flushPending],
	);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	/** An upload that finishes after the editor closed still lands in the saved markdown. */
	const applyDetached = useCallback((replacements: ReadonlyMap<string, string>) => {
		const next = replaceImageSrcs(latestMarkdown.current, replacements);
		if (next === latestMarkdown.current) return;
		latestMarkdown.current = next;
		onChangeRef.current(next);
	}, []);

	const updateSlash = useCallback((next: SlashState | null) => {
		slashRef.current = next;
		setSlash(next);
	}, []);

	const detectSlash = useCallback(
		(editor: Editor) => {
			const { selection } = editor.state;
			const { $from, empty } = selection;
			if (!empty || $from.parent.type.name !== 'paragraph') return updateSlash(null);
			const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
			const match = before.match(/^\/([^\s/]{0,24}(?: [^\s/]{0,24})?)$/u);
			if (!match || !wrapperRef.current) return updateSlash(null);
			const coords = editor.view.coordsAtPos($from.pos);
			const box = wrapperRef.current.getBoundingClientRect();
			const previous = slashRef.current;
			updateSlash({
				query: match[1],
				index: previous && previous.query === match[1] ? previous.index : 0,
				top: coords.bottom - box.top + 6,
				left: Math.max(0, coords.left - box.left - 4),
			});
		},
		[updateSlash],
	);

	const runSlash = useCallback(
		(command: SlashCommand) => {
			const editor = editorRef.current;
			if (!editor) return;
			const { $from } = editor.state.selection;
			editor.chain().focus().deleteRange({ from: $from.start(), to: $from.pos }).run();
			command.run(editor);
			updateSlash(null);
		},
		[updateSlash],
	);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: learnEditorExtensions(),
		content: value,
		contentType: 'markdown',
		onCreate: ({ editor: current }) => {
			const image = (
				current.storage as {
					image?: {
						pick?: () => void;
						upload?: (file: File, apply?: (url: string) => void) => void;
					};
				}
			).image;
			if (image) {
				image.pick = () => fileRef.current?.click();
				image.upload = (file, apply) => uploadRef.current(file, apply);
			}
			if (defaultMode === 'markdown') return;
			const exported = normalizeEditorMarkdown(current.getMarkdown());
			const fidelity = compareLectureText(value, exported);
			if (fidelity.hunks.length) {
				setMode('markdown');
				setSource(value);
				setLossHunks(fidelity.hunks);
			}
		},
		editorProps: {
			attributes: {
				class: 'ln-prose ln-editor__content',
				spellcheck: 'false',
				role: 'textbox',
				'aria-label': label,
				'aria-multiline': 'true',
			},
			transformPastedHTML: (html) => preparePastedImages(html, pastedImages.current),
			handleDrop: (view, event, _slice, moved) => {
				if (moved) return false;
				const files = [...(event.dataTransfer?.files ?? [])].filter((file) =>
					file.type.startsWith('image/'),
				);
				if (!files.length) return false;
				event.preventDefault();
				const position =
					view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
					view.state.selection.from;
				const md = editorRef.current?.getMarkdown() ?? '';
				if (
					files.some((file) =>
						findImageRefs(md).some(
							(ref) => ref.status !== 'ready' && imageFileKey(ref.url) === imageFileKey(file.name),
						),
					)
				)
					attachRef.current(files);
				else insertRef.current(files, position);
				return true;
			},
			handlePaste: (_view, event) => {
				const markdown = markdownFromPaste(
					event.clipboardData?.getData('text/plain') ?? '',
					event.clipboardData?.getData('text/html') ?? '',
				);
				if (markdown !== null && editorRef.current) {
					event.preventDefault();
					editorRef.current
						.chain()
						.focus()
						.insertContent(markdown, { contentType: 'markdown' })
						.run();
					return true;
				}
				if (pastedHtmlHasText(event.clipboardData?.getData('text/html') ?? '')) return false;
				const files = [...(event.clipboardData?.files ?? [])].filter((file) =>
					file.type.startsWith('image/'),
				);
				if (!files.length) return false;
				event.preventDefault();
				insertRef.current(files);
				return true;
			},
			handleKeyDown: (_view, event) => {
				const current = slashRef.current;
				if (!current) return false;
				const items = filterSlashCommands(current.query);
				if (!items.length) return false;
				if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
					const step = event.key === 'ArrowDown' ? 1 : -1;
					updateSlash({ ...current, index: (current.index + step + items.length) % items.length });
					return true;
				}
				if (event.key === 'Enter' || event.key === 'Tab') {
					runSlash(items[Math.min(current.index, items.length - 1)]);
					return true;
				}
				if (event.key === 'Escape') {
					updateSlash(null);
					return true;
				}
				return false;
			},
		},
		onUpdate: ({ editor: current }) => {
			detectSlash(current);
			if (pastedImages.current.size) {
				pasteJobs.current++;
				setProcessingPaste(true);
				void resolvePastedImages(
					current,
					pastedImages.current,
					uploads.uploadFile,
					applyDetached,
				).finally(() => {
					pasteJobs.current--;
					if (!current.isDestroyed) setProcessingPaste(pasteJobs.current > 0);
				});
			}
			scheduleChange(() => normalizeEditorMarkdown(current.getMarkdown()));
		},
		onSelectionUpdate: ({ editor: current }) => detectSlash(current),
		onBlur: () => {
			updateSlash(null);
			flushPending();
		},
	});

	useEffect(() => {
		editorRef.current = editor;
	}, [editor]);

	useEffect(() => registerEditorFlush(flushPending), [flushPending]);

	const bindInsertRef = useRef(bindInsert);
	useEffect(() => {
		bindInsertRef.current = bindInsert;
	}, [bindInsert]);
	useEffect(() => {
		const insert = (snippet: string) => {
			if (mode === 'visual' && editorRef.current) {
				editorRef.current.chain().focus().insertContent(snippet, { contentType: 'markdown' }).run();
				return;
			}
			const node = textareaRef.current;
			const current = sourceRef.current;
			const start = node?.selectionStart ?? current.length;
			const end = node?.selectionEnd ?? start;
			const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
			const caret = start + snippet.length;
			sourceRef.current = next;
			latestMarkdown.current = next;
			setSource(next);
			onChangeRef.current(next);
			requestAnimationFrame(() => {
				node?.focus();
				node?.setSelectionRange(caret, caret);
			});
		};
		bindInsertRef.current?.(insert);
		return () => bindInsertRef.current?.(null);
	}, [mode]);

	useEffect(() => () => flushPending(), [flushPending]);

	function changeSource(next: string) {
		sourceRef.current = next;
		latestMarkdown.current = next;
		setSource(next);
		onChangeRef.current(next);
	}

	async function insertFiles(files: File[], position?: number) {
		if (mode === 'visual' && editorRef.current) {
			await insertImageFiles(
				editorRef.current,
				files,
				position ?? editorRef.current.state.selection.from,
				uploads.uploadFile,
				applyDetached,
			);
			return;
		}
		const placeholders = files.map((file) => ({
			file,
			src: `anh-dan-${crypto.randomUUID()}-${encodeURIComponent(file.name)}`,
		}));
		const current = sourceRef.current;
		const start = textareaRef.current?.selectionStart ?? current.length;
		const end = textareaRef.current?.selectionEnd ?? start;
		changeSource(
			current.slice(0, start) +
				'\n' +
				placeholders.map(({ src }) => `![](${src})`).join('\n') +
				'\n' +
				current.slice(end),
		);
		await Promise.all(
			placeholders.map(async ({ file, src }) => {
				const url = await uploads.uploadFile(file);
				if (url) changeSource(replaceImageSrcs(sourceRef.current, new Map([[src, url]])));
			}),
		);
	}
	useEffect(() => {
		insertRef.current = (files, position) => {
			void insertFiles(files, position);
		};
		uploadRef.current = (file, apply) => {
			if (apply)
				void uploads.uploadFile(file).then((url) => {
					if (url && !editorRef.current?.isDestroyed) apply(url);
				});
			else void insertFiles([file]);
		};
	});

	async function attachFiles(files: File[]) {
		const current =
			mode === 'markdown' ? sourceRef.current : (editorRef.current?.getMarkdown() ?? value);
		const { replacements, unmatched, count } = await matchImageFiles(
			findImageRefs(current),
			files,
			uploads.uploadFile,
		);
		if (mode === 'markdown') changeSource(replaceImageSrcs(sourceRef.current, replacements));
		else if (editorRef.current) {
			const nodeReplacements = new Map(
				[...replacements].map(([src, url]) => [splitImageSrc(src).url, url]),
			);
			replaceEditorImages(editorRef.current, nodeReplacements);
		}
		setAttachmentNote(
			`Đã gắn ${count} ảnh${unmatched.length ? ` · ${unmatched.length} file không khớp: ${unmatched.join(', ')}` : ''}`,
		);
	}
	useEffect(() => {
		attachRef.current = (files) => void attachFiles(files);
	});

	function switchMode(next: Mode, force = false) {
		if (next === mode || !editor) return;
		flushPending();
		if (next === 'markdown') {
			setSource(normalizeEditorMarkdown(editor.getMarkdown()));
			setModeWarning(null);
			setLossHunks(null);
			updateSlash(null);
			setMode(next);
			return;
		}
		editor.commands.setContent(source, { contentType: 'markdown', emitUpdate: false });
		if (!force) {
			const unsupported = findUnsupportedMarkdown(source);
			const fidelity = compareLectureText(source, normalizeEditorMarkdown(editor.getMarkdown()));
			if (unsupported.length || fidelity.hunks.length) {
				setModeWarning(unsupported.length ? unsupported : null);
				setLossHunks(fidelity.hunks.length ? fidelity.hunks : null);
				return;
			}
		}
		setModeWarning(null);
		setLossHunks(null);
		updateSlash(null);
		setMode(next);
	}

	const markdownNow = mode === 'markdown' ? source : value;
	const words = countWords(markdownNow);
	const items = slash ? filterSlashCommands(slash.query) : [];

	return (
		<div
			className="ln-editor"
			onDragOverCapture={(event) => {
				if (
					[...(event.dataTransfer.items ?? [])].some(
						(item) => item.webkitGetAsEntry?.()?.isDirectory,
					)
				)
					event.preventDefault();
			}}
			onDropCapture={(event) => {
				if (
					![...(event.dataTransfer.items ?? [])].some(
						(item) => item.webkitGetAsEntry?.()?.isDirectory,
					)
				)
					return;
				event.preventDefault();
				event.stopPropagation();
				setReadingFiles(true);
				void droppedImageFiles(event.dataTransfer)
					.then((files) => attachFiles(files))
					.catch(() => setAttachmentNote('Không đọc được thư mục ảnh. Hãy chọn các file ảnh.'))
					.finally(() => setReadingFiles(false));
			}}
		>
			<div
				className="ln-editor__modes"
				role="tablist"
				aria-label="Chế độ soạn"
				onKeyDown={onTabListKeyDown}
			>
				<button
					type="button"
					role="tab"
					disabled={uploads.uploading || readingFiles || processingPaste}
					aria-selected={mode === 'visual'}
					tabIndex={mode === 'visual' ? 0 : -1}
					onClick={() => switchMode('visual')}
				>
					Soạn trực quan
				</button>
				<button
					type="button"
					role="tab"
					disabled={uploads.uploading || readingFiles || processingPaste}
					aria-selected={mode === 'markdown'}
					tabIndex={mode === 'markdown' ? 0 : -1}
					onClick={() => switchMode('markdown')}
				>
					<StudioIcon name="markdown" /> Markdown
				</button>
				<span className="ln-editor__count tabular-nums">
					{words.toLocaleString('vi-VN')} từ · ~{estimateReadingMinutes(markdownNow)} phút đọc
				</span>
			</div>
			<MissingImagesBar
				markdown={markdownNow}
				disabled={readingFiles || uploads.uploading}
				onFiles={(files) => void attachFiles(files)}
				onReplace={
					mode === 'markdown'
						? (index, file) =>
								void uploadImageAt(
									index,
									file,
									() => sourceRef.current,
									changeSource,
									uploads.uploadFile,
								)
						: undefined
				}
			/>
			<ImageUploadStatus uploads={uploads} />
			{attachmentNote ? (
				<p className="ln-editor__upload" role="status">
					{attachmentNote}
				</p>
			) : null}
			{mode === 'visual' ? (
				<>
					{editor ? (
						<EditorToolbar editor={editor} onPickImage={() => fileRef.current?.click()} />
					) : null}

					<div ref={wrapperRef} className="ln-editor__surface">
						{editor ? (
							<BubbleMenu editor={editor} className="ln-bubble">
								<button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>
									Đậm
								</button>
								<button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
									Nghiêng
								</button>
								<button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}>
									Gạch
								</button>
								<button type="button" onClick={() => editor.chain().focus().toggleCode().run()}>
									Code
								</button>
								<button
									type="button"
									onClick={() => editor.chain().focus().setCallout('important').run()}
								>
									Cốt lõi
								</button>
							</BubbleMenu>
						) : null}
						<EditorContent editor={editor} />
						{slash ? (
							<SlashMenu
								state={slash}
								items={items}
								onPick={runSlash}
								onHover={(index) => updateSlash({ ...slash, index })}
							/>
						) : null}
					</div>
				</>
			) : (
				<div className="ln-editor__source-wrap">
					{modeWarning || lossHunks?.length ? (
						<div className="ln-editor__warning" role="alert">
							{modeWarning?.length ? (
								<p>
									Mục này có {modeWarning.join(', ')} — soạn trực quan hiện chưa giữ được các phần
									này. Sửa ở đây, hoặc vẫn chuyển sang và chấp nhận mất định dạng đó.
								</p>
							) : null}
							{lossHunks?.length ? (
								<>
									<p>Chuyển sang soạn trực quan sẽ đổi các chữ sau.</p>
									<TextDiff hunks={lossHunks} />
								</>
							) : null}
							<div className="flex flex-wrap gap-x-4 gap-y-1">
								<button
									type="button"
									className="ln-link-btn"
									onClick={() => switchMode('visual', true)}
								>
									Vẫn chuyển sang soạn trực quan
								</button>
								<button
									type="button"
									className="ln-link-btn"
									onClick={() => {
										setModeWarning(null);
										setLossHunks(null);
									}}
								>
									Ở lại Markdown
								</button>
							</div>
						</div>
					) : null}
					<MarkdownInsertBar
						textareaRef={textareaRef}
						value={source}
						onChange={changeSource}
						previewShown={previewShown}
						showPreviewToggle={markdownPreview}
						onTogglePreview={togglePreview}
						onOpenHelp={onOpenHelp}
					/>
					<div className="ln-editor__split" data-preview={previewShown ? 'true' : 'false'}>
						<textarea
							aria-label={label}
							onScroll={(event) => syncPreview(event.currentTarget)}
							ref={textareaRef}
							onPaste={(event) => {
								const files = [...event.clipboardData.files].filter((file) =>
									file.type.startsWith('image/'),
								);
								if (files.length && !pastedHtmlHasText(event.clipboardData.getData('text/html'))) {
									event.preventDefault();
									void insertFiles(files);
								}
							}}
							onDragOver={(event) => {
								if (event.dataTransfer.types.includes('Files')) event.preventDefault();
							}}
							onDrop={(event) => {
								const files = [...event.dataTransfer.files].filter((file) =>
									file.type.startsWith('image/'),
								);
								if (files.length) {
									event.preventDefault();
									const refs = findImageRefs(sourceRef.current);
									if (
										files.some((file) =>
											refs.some(
												(ref) =>
													ref.status !== 'ready' &&
													imageFileKey(ref.url) === imageFileKey(file.name),
											),
										)
									)
										void attachFiles(files);
									else void insertFiles(files);
								}
							}}
							className="ln-editor__source"
							value={source}
							spellCheck={false}
							onChange={(event) => {
								changeSource(event.target.value);
							}}
							onBlur={() => flushPending()}
							placeholder={'## Tiêu đề\n\nNội dung…\n\n> [!DEFINITION] Khái niệm\n> Định nghĩa…'}
						/>
						{markdownPreview && previewShown ? (
							<div
								ref={previewRef}
								className="ln-editor__preview"
								role="region"
								aria-label="Xem trước như học viên"
							>
								<p className="ln-editor__preview-label">Xem trước như học viên</p>
								<LearnMarkdown markdown={source} showMissingImages />
							</div>
						) : null}
					</div>
				</div>
			)}
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
