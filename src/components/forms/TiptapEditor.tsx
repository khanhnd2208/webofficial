'use client';

import { Icon } from '@/components/ui/Icon';
import { GRAPHIC_COLORS } from '@/config/graphicColors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { common, createLowlight } from 'lowlight';
import { normalizeDraftHtml } from '@/features/my-class/client/adminDraft';

const lowlight = createLowlight(common);

/* ═════════════════════════════════════════════
   Toolbar Button
   ═════════════════════════════════════════════ */
function Btn({
	onClick,
	active,
	disabled,
	title,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault();
				onClick();
			}}
			disabled={disabled}
			title={title}
			aria-label={title}
			aria-pressed={active}
			className={`flex h-11 w-11 items-center justify-center rounded transition-colors sm:h-11 sm:w-11 ${
				active
					? 'bg-accent/15 text-accent'
					: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
			} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
		>
			{children}
		</button>
	);
}

function Sep() {
	return <div className="mx-0.5 h-5 w-px bg-border" />;
}

type PaletteColor = {
	label: string;
	value: string | null;
};

const TEXT_COLORS: PaletteColor[] = [
	{ label: 'Mặc định', value: null },
	{ label: 'Slate', value: GRAPHIC_COLORS['475569'] },
	{ label: 'Đỏ', value: GRAPHIC_COLORS['dc2626'] },
	{ label: 'Cam', value: GRAPHIC_COLORS['ea580c'] },
	{ label: 'Vàng đậm', value: GRAPHIC_COLORS['ca8a04'] },
	{ label: 'Xanh lá', value: GRAPHIC_COLORS['15803d'] },
	{ label: 'Xanh dương', value: GRAPHIC_COLORS['2563eb'] },
	{ label: 'Tím', value: GRAPHIC_COLORS['7c3aed'] },
	{ label: 'Hồng', value: GRAPHIC_COLORS['db2777'] },
];

const HIGHLIGHT_COLORS: PaletteColor[] = [
	{ label: 'Không highlight', value: null },
	{ label: 'Vàng', value: GRAPHIC_COLORS['fef08a'] },
	{ label: 'Cam nhạt', value: GRAPHIC_COLORS['fed7aa'] },
	{ label: 'Xanh lá nhạt', value: GRAPHIC_COLORS['bbf7d0'] },
	{ label: 'Xanh dương nhạt', value: GRAPHIC_COLORS['bae6fd'] },
	{ label: 'Tím nhạt', value: GRAPHIC_COLORS['ddd6fe'] },
	{ label: 'Hồng nhạt', value: GRAPHIC_COLORS['fbcfe8'] },
];

function Palette({
	label,
	colors,
	current,
	onSelect,
}: {
	label: string;
	colors: PaletteColor[];
	current?: string | null;
	onSelect: (color: string | null) => void;
}) {
	return (
		<div
			className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-secondary/70 px-3 py-2"
			role="group"
			aria-label={label}
		>
			<span className="mr-1 text-xs font-medium text-foreground-secondary">{label}</span>
			{colors.map((color) => {
				const selected = (current ?? null) === color.value;
				const isClear = color.value === null;
				return (
					<button
						key={color.label}
						type="button"
						onMouseDown={(event) => {
							event.preventDefault();
							onSelect(color.value);
						}}
						aria-label={`${label}: ${color.label}`}
						title={color.label}
						aria-pressed={selected}
						className={`relative h-7 w-7 rounded-full border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${selected ? 'ring-2 ring-accent ring-offset-1' : 'border-border'}`}
						style={color.value ? { backgroundColor: color.value } : undefined}
					>
						{isClear ? (
							<Icon
								name="close"
								className="mx-auto h-4 w-4 text-foreground-secondary"
								aria-hidden="true"
							/>
						) : label === 'Màu chữ' ? (
							<span className="font-bold text-white drop-shadow-sm" aria-hidden="true">
								A
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}

/* ═════════════════════════════════════════════
   Link Dialog
   ═════════════════════════════════════════════ */
function LinkDialog({
	onSubmit,
	onClose,
	initialUrl,
	placeholder = 'https://example.com',
}: {
	onSubmit: (url: string) => void;
	onClose: () => void;
	initialUrl?: string;
	placeholder?: string;
}) {
	const [url, setUrl] = useState(initialUrl ?? '');
	return (
		<div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated p-2 shadow-lg">
			<input
				type="url"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder={placeholder}
				className="w-56 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
				autoFocus
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						onSubmit(url);
					}
					if (e.key === 'Escape') onClose();
				}}
			/>
			<button
				type="button"
				onClick={() => onSubmit(url)}
				className="rounded bg-accent px-2.5 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				OK
			</button>
			{initialUrl && (
				<button
					type="button"
					onClick={() => onSubmit('')}
					className="rounded px-2 py-1.5 text-xs text-error hover:bg-error-subtle"
					title="Xoá link"
				>
					✕
				</button>
			)}
		</div>
	);
}

/* ═════════════════════════════════════════════
   Main Editor Component
   ═════════════════════════════════════════════ */
interface TiptapEditorProps {
	content: string;
	onChange: (html: string) => void;
	onImageUpload?: (file: File) => Promise<string>;
	onImageUploadError?: (message: string) => void;
	placeholder?: string;
	/** Optional CSS font-family string; applied to the editor content area */
	fontFamily?: string;
}

function equivalentEditorHtml(left: string, right: string) {
	return normalizeDraftHtml(left) === normalizeDraftHtml(right);
}

export default function TiptapEditor({
	content,
	onChange,
	onImageUpload,
	onImageUploadError,
	placeholder = 'Bắt đầu viết bài...',
	fontFamily,
}: TiptapEditorProps) {
	const contentRef = useRef(content);
	contentRef.current = content;
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
	const [showSourceView, setShowSourceView] = useState(false);
	const [openPalette, setOpenPalette] = useState<'text' | 'highlight' | null>(null);
	const [sourceHtml, setSourceHtml] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isInternalUpdate = useRef(false);
	const [isUploading, setIsUploading] = useState(false);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				codeBlock: false, // we use lowlight instead
				link: false, // configured below with the editor's custom styling
				underline: false, // registered below for the same reason
				dropcursor: { color: 'var(--accent)', width: 2 },
			}),
			Placeholder.configure({ placeholder }),
			Underline,
			Superscript,
			Subscript,
			TextStyle,
			Color,
			Highlight.configure({ multicolor: true }),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
				alignments: ['left', 'center', 'right', 'justify'],
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-accent underline underline-offset-2 hover:text-accent-hover cursor-pointer',
				},
			}),
			Image.configure({
				HTMLAttributes: { class: 'rounded-xl mx-auto max-w-full', loading: 'lazy' },
				allowBase64: true,
			}),
			Youtube.configure({
				HTMLAttributes: {
					class: 'not-prose my-6 aspect-video overflow-hidden border border-border w-full',
				},
				width: 0,
				height: 0,
			}),
			CodeBlockLowlight.configure({ lowlight }),
			Table.configure({ resizable: true }),
			TableRow,
			TableCell,
			TableHeader,
		],
		content,
		editorProps: {
			attributes: {
				class:
					'tiptap-content prose prose-lg dark:prose-invert max-w-none outline-none min-h-[480px] px-6 py-5',
				...(fontFamily ? { style: `font-family: ${fontFamily}` } : {}),
			},
			handleDrop: (view, event) => {
				const files = event.dataTransfer?.files;
				if (files?.length && files[0].type.startsWith('image/')) {
					event.preventDefault();
					void handleImageFile(files[0]);
					return true;
				}
				return false;
			},
			handlePaste: (view, event) => {
				const files = event.clipboardData?.files;
				if (files?.length && files[0].type.startsWith('image/')) {
					event.preventDefault();
					void handleImageFile(files[0]);
					return true;
				}
				return false;
			},
		},
		onUpdate: ({ editor: e }) => {
			const html = e.getHTML();
			if (equivalentEditorHtml(html, contentRef.current)) return;
			isInternalUpdate.current = true;
			onChange(html);
			// Reset the flag after React finishes processing
			queueMicrotask(() => {
				isInternalUpdate.current = false;
			});
		},
	});

	const handleImageFile = useCallback(
		async (file: File) => {
			if (!editor || !onImageUpload) return;
			setIsUploading(true);
			try {
				const url = await onImageUpload(file);
				editor.chain().focus().setImage({ src: url }).run();
			} catch (error) {
				onImageUploadError?.(error instanceof Error ? error.message : 'Không tải ảnh lên được');
			} finally {
				setIsUploading(false);
			}
		},
		[editor, onImageUpload, onImageUploadError],
	);

	// Sync external content changes (e.g. draft load) into the editor.
	// Only update if the editor content is truly different from the prop.
	// Sync fontFamily changes into the editor's editorProps
	useEffect(() => {
		if (!editor) return;
		editor.setOptions({
			editorProps: {
				attributes: {
					class:
						'tiptap-content prose prose-lg dark:prose-invert max-w-none outline-none min-h-[480px] px-6 py-5',
					...(fontFamily ? { style: `font-family: ${fontFamily}` } : {}),
				},
			},
		});
	}, [fontFamily, editor]);

	useEffect(() => {
		if (!editor || isInternalUpdate.current) return;
		const currentHtml = editor.getHTML();
		// Only set content if it actually differs (avoids cursor-reset loops)
		if (content !== currentHtml && !equivalentEditorHtml(content, currentHtml)) {
			editor.commands.setContent(content, { emitUpdate: false });
		}
	}, [editor, content]);

	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleLinkSubmit = useCallback(
		(url: string) => {
			if (!editor) return;
			setShowLinkDialog(false);
			if (!url) {
				editor.chain().focus().unsetLink().run();
				return;
			}
			const href = url.startsWith('http') ? url : `https://${url}`;
			editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
		},
		[editor],
	);

	const addYoutube = useCallback(
		(url: string) => {
			if (!editor || !url.trim()) {
				setShowYoutubeDialog(false);
				return;
			}
			editor.commands.setYoutubeVideo({ src: url.trim() });
			setShowYoutubeDialog(false);
		},
		[editor],
	);

	const addTable = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}, [editor]);

	const applyTextColor = useCallback(
		(color: string | null) => {
			if (!editor) return;
			if (color) editor.chain().focus().setColor(color).run();
			else editor.chain().focus().unsetColor().run();
		},
		[editor],
	);

	const applyHighlight = useCallback(
		(color: string | null) => {
			if (!editor) return;
			if (color) editor.chain().focus().toggleHighlight({ color }).run();
			else editor.chain().focus().unsetHighlight().run();
		},
		[editor],
	);

	const toggleSourceView = useCallback(() => {
		if (!editor) return;
		if (!showSourceView) {
			setSourceHtml(editor.getHTML());
			setShowSourceView(true);
		} else {
			editor.commands.setContent(sourceHtml, { emitUpdate: true });
			setShowSourceView(false);
		}
	}, [editor, showSourceView, sourceHtml]);

	if (!editor) return null;

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
			{/* ═══ Toolbar ═══ */}
			<div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-secondary px-2 py-1.5">
				{/* Text formatting */}
				<Btn
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive('bold')}
					title="Bold (⌘B)"
				>
					<Icon name="bold" size={14} />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive('italic')}
					title="Italic (⌘I)"
				>
					<Icon name="italic" size={14} />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					active={editor.isActive('underline')}
					title="Underline (⌘U)"
				>
					<Icon name="underline" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleStrike().run()}
					active={editor.isActive('strike')}
					title="Strikethrough"
				>
					<Icon name="strike" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleSuperscript().run()}
					active={editor.isActive('superscript')}
					title="Superscript"
				>
					<span className="text-xs font-bold">
						X<sup className="text-xs">²</sup>
					</span>
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleSubscript().run()}
					active={editor.isActive('subscript')}
					title="Subscript"
				>
					<span className="text-xs font-bold">
						X<sub className="text-xs">₂</sub>
					</span>
				</Btn>
				<Btn
					onClick={() => setOpenPalette((value) => (value === 'text' ? null : 'text'))}
					active={openPalette === 'text'}
					title="Màu chữ"
				>
					<span
						className="relative font-serif text-sm font-bold leading-none"
						style={{
							color:
								(editor.getAttributes('textStyle').color as string | undefined) ?? 'currentColor',
						}}
					>
						A<span className="absolute -bottom-1 left-0 right-0 h-1 rounded-sm bg-current" />
					</span>
				</Btn>
				<Btn
					onClick={() => setOpenPalette((value) => (value === 'highlight' ? null : 'highlight'))}
					active={openPalette === 'highlight' || editor.isActive('highlight')}
					title="Highlight"
				>
					<span className="relative text-sm font-bold leading-none">
						<span aria-hidden="true">A</span>
						<span
							className="absolute -bottom-1 left-[-2px] right-[-2px] h-1 rounded-sm"
							style={{
								backgroundColor:
									(editor.getAttributes('highlight').color as string | undefined) ??
									'var(--accent)',
							}}
						/>
					</span>
				</Btn>

				<Sep />

				{/* Headings */}
				<Btn
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					active={editor.isActive('heading', { level: 1 })}
					title="Heading 1"
				>
					<span className="text-xs font-black">H1</span>
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					active={editor.isActive('heading', { level: 2 })}
					title="Heading 2"
				>
					<span className="text-xs font-black">H2</span>
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					active={editor.isActive('heading', { level: 3 })}
					title="Heading 3"
				>
					<span className="text-xs font-black">H3</span>
				</Btn>

				<Sep />

				{/* Lists */}
				<Btn
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive('bulletList')}
					title="Bullet list"
				>
					<Icon name="list" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive('orderedList')}
					title="Numbered list"
				>
					<Icon name="ordered" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					active={editor.isActive('blockquote')}
					title="Blockquote"
				>
					<Icon name="quote" className="h-3.5 w-3.5" />
				</Btn>

				<Sep />

				{/* Alignment */}
				<Btn
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					active={editor.isActive({ textAlign: 'left' })}
					title="Align left"
				>
					<Icon name="align_left" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					active={editor.isActive({ textAlign: 'center' })}
					title="Center"
				>
					<Icon name="align_center" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					active={editor.isActive({ textAlign: 'right' })}
					title="Align right"
				>
					<Icon name="align_right" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().setTextAlign('justify').run()}
					active={editor.isActive({ textAlign: 'justify' })}
					title="Justify"
				>
					<Icon name="align_justify" className="h-3.5 w-3.5" />
				</Btn>

				<Sep />

				{/* Insert */}
				<Btn
					onClick={() => setShowLinkDialog(!showLinkDialog)}
					active={editor.isActive('link')}
					title="Link (⌘K)"
				>
					<Icon name="link" className="h-3.5 w-3.5" />
				</Btn>
				<Btn onClick={openFileDialog} title="Chèn ảnh" disabled={isUploading}>
					{isUploading ? (
						<span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-accent" />
					) : (
						<Icon name="image" className="h-3.5 w-3.5" />
					)}
				</Btn>
				<Btn onClick={() => setShowYoutubeDialog((v) => !v)} title="Chèn YouTube">
					<Icon name="play_arrow" className="h-3.5 w-3.5" filled />
				</Btn>
				<Btn onClick={addTable} title="Chèn bảng">
					<Icon name="table" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					title="Đường kẻ ngang"
				>
					<Icon name="remove" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					active={editor.isActive('codeBlock')}
					title="Code block"
				>
					<Icon name="code" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().toggleCode().run()}
					active={editor.isActive('code')}
					title="Inline code"
				>
					<Icon name="code" className="h-3.5 w-3.5" />
				</Btn>

				<Sep />

				{/* Spacer */}
				<div className="flex-1" />

				{/* Undo / Redo */}
				<Btn
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					title="Undo (⌘Z)"
				>
					<Icon name="undo" className="h-3.5 w-3.5" />
				</Btn>
				<Btn
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					title="Redo (⌘⇧Z)"
				>
					<Icon name="redo" className="h-3.5 w-3.5" />
				</Btn>

				<Sep />

				{/* Source HTML view toggle */}
				<Btn onClick={toggleSourceView} active={showSourceView} title="Xem/chỉnh HTML source">
					<Icon name="code" className="h-3.5 w-3.5" />
				</Btn>
			</div>

			{openPalette === 'text' && (
				<Palette
					label="Màu chữ"
					colors={TEXT_COLORS}
					current={editor.getAttributes('textStyle').color as string | undefined}
					onSelect={applyTextColor}
				/>
			)}
			{openPalette === 'highlight' && (
				<Palette
					label="Highlight"
					colors={HIGHLIGHT_COLORS}
					current={editor.getAttributes('highlight').color as string | undefined}
					onSelect={applyHighlight}
				/>
			)}

			{/* ═══ Link Dialog ═══ */}
			{showLinkDialog && (
				<div className="border-b border-border bg-surface-secondary/50 px-3 py-2">
					<LinkDialog
						initialUrl={editor.getAttributes('link').href as string | undefined}
						onSubmit={handleLinkSubmit}
						onClose={() => setShowLinkDialog(false)}
					/>
				</div>
			)}

			{showYoutubeDialog && (
				<div className="border-b border-border bg-surface-secondary/50 px-3 py-2">
					<LinkDialog
						placeholder="https://www.youtube.com/watch?v=..."
						onSubmit={addYoutube}
						onClose={() => setShowYoutubeDialog(false)}
					/>
				</div>
			)}

			{/* ═══ Editor / Source View ═══ */}
			{showSourceView ? (
				<textarea
					value={sourceHtml}
					onChange={(e) => setSourceHtml(e.target.value)}
					className="min-h-120 w-full bg-surface p-6 font-mono text-sm text-foreground outline-none"
					spellCheck={false}
				/>
			) : (
				<EditorContent editor={editor} />
			)}

			{/* Hidden file input for image upload */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) await handleImageFile(file);
					e.target.value = '';
				}}
			/>

			{/* Table controls (shown when cursor is in a table) */}
			{editor.isActive('table') && (
				<div className="flex flex-wrap items-center gap-1 border-t border-border bg-surface-secondary/50 px-3 py-1.5 text-xs font-medium text-muted">
					<span className="mr-1 text-foreground-secondary">Bảng:</span>
					<button
						type="button"
						onClick={() => editor.chain().focus().addColumnAfter().run()}
						className="rounded px-1.5 py-0.5 hover:bg-surface-hover hover:text-foreground"
					>
						+ Cột
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().addRowAfter().run()}
						className="rounded px-1.5 py-0.5 hover:bg-surface-hover hover:text-foreground"
					>
						+ Hàng
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().deleteColumn().run()}
						className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error"
					>
						- Cột
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().deleteRow().run()}
						className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error"
					>
						- Hàng
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().deleteTable().run()}
						className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error"
					>
						Xoá bảng
					</button>
				</div>
			)}
		</div>
	);
}
