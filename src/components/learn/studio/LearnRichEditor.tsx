'use client';

import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CALLOUT_KINDS, CALLOUT_LABELS } from '@/features/learn/callouts';
import { countWords, estimateReadingMinutes, normalizeEditorMarkdown } from '@/features/learn/content';
import { findUnsupportedMarkdown } from '@/features/learn/markdownFidelity';
import { compareLectureText, type TextHunk } from '@/features/learn/textFidelity';
import LearnMarkdown from '@/components/learn/LearnMarkdown';
import { adminFetch } from '@/lib/admin/client';

import { learnEditorExtensions } from './editorExtensions';
import TextDiff from './TextDiff';
import { StudioIcon, type StudioIconName } from './icons';
import { filterSlashCommands, type SlashCommand } from './slashCommands';

type Mode = 'visual' | 'markdown';

interface SlashState {
	query: string;
	index: number;
	top: number;
	left: number;
}

function ToolButton({
	icon,
	label,
	active,
	disabled,
	onClick,
}: {
	icon: StudioIconName;
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className="ln-tool"
			aria-label={label}
			title={label}
			aria-pressed={active}
			disabled={disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
		>
			<StudioIcon name={icon} />
		</button>
	);
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
	const state = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			block: current.isActive('heading', { level: 2 })
				? 'h2'
				: current.isActive('heading', { level: 3 })
					? 'h3'
					: current.isActive('heading', { level: 4 })
						? 'h4'
						: 'p',
			bold: current.isActive('bold'),
			italic: current.isActive('italic'),
			strike: current.isActive('strike'),
			link: current.isActive('link'),
			bullet: current.isActive('bulletList'),
			ordered: current.isActive('orderedList'),
			quote: current.isActive('blockquote'),
			callout: current.isActive('callout'),
			table: current.isActive('table'),
			canUndo: current.can().undo(),
			canRedo: current.can().redo(),
		}),
	});
	const [calloutOpen, setCalloutOpen] = useState(false);
	const [linkOpen, setLinkOpen] = useState(false);
	const [href, setHref] = useState('');

	function setBlock(value: string) {
		const chain = editor.chain().focus();
		if (value === 'p') chain.setParagraph().run();
		else chain.setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
	}

	function toggleLink() {
		if (state.link) {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			setLinkOpen(false);
			return;
		}
		const current = editor.getAttributes('link').href;
		setHref(typeof current === 'string' ? current : '');
		setLinkOpen(true);
	}

	function applyLink() {
		const next = href.trim();
		setLinkOpen(false);
		if (!next) return;
		editor.chain().focus().extendMarkRange('link').setLink({ href: next }).run();
	}

	return (
		<div className="ln-toolbar" role="toolbar" aria-label="Định dạng">
			<select
				className="ln-toolbar__select"
				value={state.block}
				onChange={(event) => setBlock(event.target.value)}
				aria-label="Kiểu đoạn"
			>
				<option value="p">Đoạn văn</option>
				<option value="h2">Tiêu đề lớn</option>
				<option value="h3">Tiêu đề nhỏ</option>
				<option value="h4">Tiêu đề phụ</option>
			</select>
			<span className="ln-toolbar__sep" />
			<ToolButton icon="bold" label="Đậm (⌘B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
			<ToolButton icon="italic" label="Nghiêng (⌘I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
			<ToolButton icon="strike" label="Gạch ngang" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
			<ToolButton icon="link" label={state.link ? 'Bỏ liên kết' : 'Chèn liên kết'} active={state.link || linkOpen} onClick={toggleLink} />
			{linkOpen ? (
				<form
					className="ln-linkpop"
					onSubmit={(event) => {
						event.preventDefault();
						applyLink();
					}}
				>
					<input
						autoFocus
						value={href}
						placeholder="https://"
						aria-label="Đường dẫn"
						onChange={(event) => setHref(event.target.value)}
					/>
					<button type="submit">Gắn</button>
				</form>
			) : null}
			<span className="ln-toolbar__sep" />
			<ToolButton icon="list" label="Danh sách" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
			<ToolButton icon="ordered" label="Danh sách số" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
			<ToolButton icon="quote" label="Trích đoạn" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
			<div className="relative">
				<ToolButton icon="callout" label="Khối học thuật" active={state.callout || calloutOpen} onClick={() => setCalloutOpen((value) => !value)} />
				{calloutOpen ? (
					<div className="ln-popover" onMouseLeave={() => setCalloutOpen(false)}>
						{CALLOUT_KINDS.map((kind) => (
							<button
								key={kind}
								type="button"
								className="ln-popover__item"
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => {
									setCalloutOpen(false);
									if (editor.isActive('callout')) {
										editor.chain().focus().updateAttributes('callout', { kind }).run();
									} else {
										editor.chain().focus().setCallout(kind).run();
									}
								}}
							>
								<span className="ln-kind-dot" data-kind={kind} />
								{CALLOUT_LABELS[kind]}
							</button>
						))}
					</div>
				) : null}
			</div>
			<ToolButton icon="table" label="Chèn bảng" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
			<ToolButton icon="image" label="Chèn ảnh" onClick={onPickImage} />
			<ToolButton icon="hr" label="Đường kẻ" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
			{state.table ? (
				<span className="ln-toolbar__group">
					<button type="button" className="ln-tool ln-tool--text" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Hàng</button>
					<button type="button" className="ln-tool ln-tool--text" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Cột</button>
					<button type="button" className="ln-tool ln-tool--text" onClick={() => editor.chain().focus().deleteRow().run()}>− Hàng</button>
					<button type="button" className="ln-tool ln-tool--text" onClick={() => editor.chain().focus().deleteColumn().run()}>− Cột</button>
					<button type="button" className="ln-tool ln-tool--text" onClick={() => editor.chain().focus().deleteTable().run()}>Xóa bảng</button>
				</span>
			) : null}
			<span className="ml-auto" />
			<ToolButton icon="undo" label="Hoàn tác (⌘Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
			<ToolButton icon="redo" label="Làm lại (⇧⌘Z)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
		</div>
	);
}

function SlashMenu({
	state,
	items,
	onPick,
	onHover,
}: {
	state: SlashState;
	items: SlashCommand[];
	onPick: (command: SlashCommand) => void;
	onHover: (index: number) => void;
}) {
	const listRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	}, [state.index]);

	if (!items.length) return null;
	return (
		<div ref={listRef} className="ln-slash" style={{ top: state.top, left: state.left }} role="listbox" aria-label="Chèn khối">
			{items.map((item, index) => {
				const header = item.group !== items[index - 1]?.group ? item.group : null;
				return (
					<div key={item.id}>
						{header ? <p className="ln-slash__group">{header}</p> : null}
						<button
							type="button"
							role="option"
							aria-selected={index === state.index}
							data-active={index === state.index ? 'true' : undefined}
							className="ln-slash__item"
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => onHover(index)}
							onClick={() => onPick(item)}
						>
							{item.id.startsWith('callout-') ? (
								<span className="ln-kind-dot" data-kind={item.id.slice(8)} />
							) : (
								<span className="ln-kind-dot" />
							)}
							<span className="ln-slash__label">{item.label}</span>
							<span className="ln-slash__hint">{item.hint}</span>
						</button>
					</div>
				);
			})}
		</div>
	);
}

/**
 * WYSIWYG section editor that reads and writes NDK markdown. A Markdown tab exposes the
 * raw source for pasting AI output; both views stay in sync.
 */
export default function LearnRichEditor({
	value,
	onChange,
	sessionChanges,
}: {
	value: string;
	onChange: (markdown: string) => void;
	sessionChanges?: { count: number; onReview: () => void } | null;
}) {
	const [mode, setMode] = useState<Mode>(() => (findUnsupportedMarkdown(value).length ? 'markdown' : 'visual'));
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
			const image = (current.storage as { image?: { pick?: () => void; upload?: (file: File, apply?: (url: string) => void) => void } }).image;
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
				const file = [...(event.dataTransfer?.files ?? [])].find((item) => item.type.startsWith('image/'));
				if (!file) return false;
				event.preventDefault();
				uploadRef.current(file);
				return true;
			},
			handlePaste: (_view, event) => {
				const file = [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith('image/'));
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
			onChangeRef.current(normalizeEditorMarkdown(current.getMarkdown()));
		},
		onSelectionUpdate: ({ editor: current }) => detectSlash(current),
		onBlur: () => updateSlash(null),
	});

	useEffect(() => {
		editorRef.current = editor;
	}, [editor]);

	async function uploadImage(file: File, apply?: (url: string) => void) {
		setUploadNote('Đang tải ảnh…');
		try {
			const form = new FormData();
			form.append('file', file);
			const payload = await adminFetch<{ url: string }>('/api/uploads', { method: 'POST', body: form });
			if (apply) apply(payload.url);
			else editorRef.current?.chain().focus().setLearnImage({ src: payload.url, alt: file.name.replace(/\.[^.]+$/, '') }).run();
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
				<button type="button" role="tab" aria-selected={mode === 'visual'} onClick={() => switchMode('visual')}>
					Soạn trực quan
				</button>
				<button type="button" role="tab" aria-selected={mode === 'markdown'} onClick={() => switchMode('markdown')}>
					<StudioIcon name="markdown" /> Markdown
				</button>
				{sessionChanges && sessionChanges.count > 0 ? (
					<button type="button" className="ln-link-btn" onClick={sessionChanges.onReview}>
						{sessionChanges.count} chỗ đã sửa · Xem
					</button>
				) : null}
				<span className="ln-editor__count tabular-nums">
					{words.toLocaleString('vi-VN')} từ · ~{estimateReadingMinutes(markdownNow)} phút đọc
				</span>
			</div>
			{mode === 'visual' ? (
				<>
					{editor ? <Toolbar editor={editor} onPickImage={() => fileRef.current?.click()} /> : null}
					{uploadNote ? <p className="ln-editor__upload" role="status">{uploadNote}</p> : null}
					<div ref={wrapperRef} className="ln-editor__surface">
						{editor ? (
							<BubbleMenu editor={editor} className="ln-bubble">
								<button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>Đậm</button>
								<button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>Nghiêng</button>
								<button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}>Gạch</button>
								<button type="button" onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
								<button type="button" onClick={() => editor.chain().focus().setCallout('important').run()}>Cốt lõi</button>
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
									Mục này có {modeWarning.join(', ')} — soạn trực quan hiện chưa giữ được các phần này. Sửa ở đây,
									hoặc vẫn chuyển sang và chấp nhận mất định dạng đó.
								</p>
							) : null}
							{lossHunks?.length ? (
								<>
									<p>Chuyển sang soạn trực quan sẽ đổi các chữ sau.</p>
									<TextDiff hunks={lossHunks} />
								</>
							) : null}
							<div className="flex flex-wrap gap-x-4 gap-y-1">
								<button type="button" className="ln-link-btn" onClick={() => switchMode('visual', true)}>
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
