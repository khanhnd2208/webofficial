'use client';

import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CALLOUT_KINDS, CALLOUT_LABELS } from '@/features/learn/callouts';
import { countWords, estimateReadingMinutes, normalizeEditorMarkdown } from '@/features/learn/content';
import { findUnsupportedMarkdown } from '@/features/learn/markdownFidelity';

import { learnEditorExtensions } from './editorExtensions';
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

function Toolbar({ editor }: { editor: Editor }) {
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

	function setBlock(value: string) {
		const chain = editor.chain().focus();
		if (value === 'p') chain.setParagraph().run();
		else chain.setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
	}

	function toggleLink() {
		if (state.link) {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		const href = window.prompt('Dán đường dẫn (https://…)');
		if (!href) return;
		editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
	}

	function insertImage() {
		const src = window.prompt('Dán đường dẫn ảnh (ví dụ /uploads/ten-anh.webp)');
		if (!src?.trim()) return;
		const alt = window.prompt('Mô tả ảnh (tuỳ chọn)')?.trim() || '';
		editor.chain().focus().setImage({ src: src.trim(), alt }).run();
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
			<ToolButton icon="link" label={state.link ? 'Bỏ liên kết' : 'Chèn liên kết'} active={state.link} onClick={toggleLink} />
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
			<ToolButton icon="image" label="Chèn ảnh" onClick={insertImage} />
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
}: {
	value: string;
	onChange: (markdown: string) => void;
}) {
	const [mode, setMode] = useState<Mode>(() => (findUnsupportedMarkdown(value).length ? 'markdown' : 'visual'));
	const [source, setSource] = useState(value);
	const [modeWarning, setModeWarning] = useState<string[] | null>(() => {
		const unsupported = findUnsupportedMarkdown(value);
		return unsupported.length ? unsupported : null;
	});
	const [slash, setSlash] = useState<SlashState | null>(null);
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
		editorProps: {
			attributes: { class: 'ln-prose ln-editor__content', spellcheck: 'false' },
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

	function switchMode(next: Mode, force = false) {
		if (next === mode || !editor) return;
		if (next === 'markdown') {
			setSource(normalizeEditorMarkdown(editor.getMarkdown()));
			setModeWarning(null);
			updateSlash(null);
			setMode(next);
			return;
		}
		if (!force) {
			const unsupported = findUnsupportedMarkdown(source);
			if (unsupported.length) {
				setModeWarning(unsupported);
				return;
			}
		}
		editor.commands.setContent(source, { contentType: 'markdown', emitUpdate: false });
		setModeWarning(null);
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
				<span className="ln-editor__count tabular-nums">
					{words.toLocaleString('vi-VN')} từ · ~{estimateReadingMinutes(markdownNow)} phút đọc
				</span>
			</div>
			{mode === 'visual' ? (
				<>
					{editor ? <Toolbar editor={editor} /> : null}
					<div ref={wrapperRef} className="ln-editor__surface">
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
					{modeWarning ? (
						<div className="ln-editor__warning" role="alert">
							<p>
								Mục này có {modeWarning.join(', ')} — soạn trực quan hiện chưa giữ được các phần này. Sửa ở đây,
								hoặc vẫn chuyển sang và chấp nhận mất định dạng đó.
							</p>
							<div className="flex flex-wrap gap-x-4 gap-y-1">
								<button type="button" className="ln-link-btn" onClick={() => switchMode('visual', true)}>
									Vẫn chuyển sang soạn trực quan
								</button>
								<button type="button" className="ln-link-btn" onClick={() => setModeWarning(null)}>
									Ở lại Markdown
								</button>
							</div>
						</div>
					) : null}
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
				</div>
			)}
		</div>
	);
}
