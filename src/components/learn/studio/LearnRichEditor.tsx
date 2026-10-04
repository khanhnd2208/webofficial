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
import { findUnsupportedMarkdown } from '@/features/learn/markdownFidelity';
import { compareLectureText, type TextHunk } from '@/features/learn/textFidelity';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { adminFetch } from '@/lib/admin/client';

import { learnEditorExtensions } from './editorExtensions';
import { registerEditorFlush } from './useStudioSaver';
import TextDiff from './TextDiff';
import { StudioIcon } from './icons';
import { filterSlashCommands, type SlashCommand } from './slashCommands';

import EditorToolbar from './EditorToolbar';
import SlashMenu, { type SlashState } from './SlashMenu';

type Mode = 'visual' | 'markdown';

/**
 * WYSIWYG section editor that reads and writes NDK markdown. A Markdown tab exposes the
 * raw source for pasting AI output; both views stay in sync.
 */
export default function LearnRichEditor({
	value,
	onChange,
}: {
	value: string;
	onChange: (markdown: string) => void;
}) {
	const [mode, setMode] = useState<Mode>(() =>
		findUnsupportedMarkdown(value).length ? 'markdown' : 'visual',
	);
	const [source, setSource] = useState(value);
	const [modeWarning, setModeWarning] = useState<string[] | null>(() => {
		const unsupported = findUnsupportedMarkdown(value);
		return unsupported.length ? unsupported : null;
	});
	const [lossHunks, setLossHunks] = useState<TextHunk[] | null>(null);
	const [uploadNote, setUploadNote] = useState<string | null>(null);
	const [slash, setSlash] = useState<SlashState | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const uploadRef = useRef<(file: File, apply?: (url: string) => void) => void>(() => {});
	const slashRef = useRef<SlashState | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const onChangeRef = useRef(onChange);
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
			const exported = normalizeEditorMarkdown(current.getMarkdown());
			const fidelity = compareLectureText(value, exported);
			if (fidelity.hunks.length) {
				setMode('markdown');
				setSource(value);
				setLossHunks(fidelity.hunks);
			}
		},
		editorProps: {
			attributes: { class: 'ln-prose ln-editor__content', spellcheck: 'false' },
			handleDrop: (_view, event) => {
				const file = [...(event.dataTransfer?.files ?? [])].find((item) =>
					item.type.startsWith('image/'),
				);
				if (!file) return false;
				event.preventDefault();
				uploadRef.current(file);
				return true;
			},
			handlePaste: (_view, event) => {
				const file = [...(event.clipboardData?.files ?? [])].find((item) =>
					item.type.startsWith('image/'),
				);
				if (!file) return false;
				event.preventDefault();
				uploadRef.current(file);
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

	useEffect(() => () => flushPending(), [flushPending]);

	async function uploadImage(file: File, apply?: (url: string) => void) {
		setUploadNote('Đang tải ảnh…');
		try {
			const form = new FormData();
			form.append('file', file);
			const payload = await adminFetch<{ url: string }>('/api/uploads', {
				method: 'POST',
				body: form,
			});
			if (apply) apply(payload.url);
			else
				editorRef.current
					?.chain()
					.focus()
					.setLearnImage({ src: payload.url, alt: file.name.replace(/\.[^.]+$/, '') })
					.run();
			setUploadNote(null);
		} catch (err) {
			setUploadNote(err instanceof Error ? err.message : 'Không tải ảnh lên được');
		}
	}
	useEffect(() => {
		uploadRef.current = (file, apply) => void uploadImage(file, apply);
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
		<div className="ln-editor">
			<div className="ln-editor__modes" role="tablist" aria-label="Chế độ soạn">
				<button
					type="button"
					role="tab"
					aria-selected={mode === 'visual'}
					onClick={() => switchMode('visual')}
				>
					Soạn trực quan
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={mode === 'markdown'}
					onClick={() => switchMode('markdown')}
				>
					<StudioIcon name="markdown" /> Markdown
				</button>
				<span className="ln-editor__count tabular-nums">
					{words.toLocaleString('vi-VN')} từ · ~{estimateReadingMinutes(markdownNow)} phút đọc
				</span>
			</div>
			{mode === 'visual' ? (
				<>
					{editor ? (
						<EditorToolbar editor={editor} onPickImage={() => fileRef.current?.click()} />
					) : null}
					{uploadNote ? (
						<p className="ln-editor__upload" role="status">
							{uploadNote}
						</p>
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
					<div className="ln-editor__split">
						<textarea
							className="ln-editor__source"
							value={source}
							spellCheck={false}
							onChange={(event) => {
								setSource(event.target.value);
								onChangeRef.current(event.target.value);
							}}
							onBlur={() => flushPending()}
							placeholder={'## Tiêu đề\n\nNội dung…\n\n> [!DEFINITION] Khái niệm\n> Định nghĩa…'}
						/>
						<div className="ln-editor__preview" aria-label="Xem trước">
							<LearnMarkdown markdown={source} />
						</div>
					</div>
				</div>
			)}
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				hidden
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = '';
					if (file) void uploadImage(file);
				}}
			/>
		</div>
	);
}
