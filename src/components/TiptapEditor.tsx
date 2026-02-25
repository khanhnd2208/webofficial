'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { common, createLowlight } from 'lowlight';

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
			onMouseDown={(e) => { e.preventDefault(); onClick(); }}
			disabled={disabled}
			title={title}
			className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
				active ? 'bg-accent/15 text-accent' : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
			} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
		>
			{children}
		</button>
	);
}

function Sep() {
	return <div className="mx-0.5 h-5 w-px bg-border" />;
}

/* ═════════════════════════════════════════════
   Link Dialog
   ═════════════════════════════════════════════ */
function LinkDialog({ onSubmit, onClose, initialUrl }: { onSubmit: (url: string) => void; onClose: () => void; initialUrl?: string }) {
	const [url, setUrl] = useState(initialUrl ?? '');
	return (
		<div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated p-2 shadow-lg">
			<input
				type="url"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder="https://example.com"
				className="w-56 rounded border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
				autoFocus
				onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(url); } if (e.key === 'Escape') onClose(); }}
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
	placeholder?: string;
}

export default function TiptapEditor({ content, onChange, onImageUpload, placeholder = 'Bắt đầu viết bài...' }: TiptapEditorProps) {
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [showSourceView, setShowSourceView] = useState(false);
	const [sourceHtml, setSourceHtml] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				codeBlock: false, // we use lowlight instead
				dropcursor: { color: 'var(--accent)', width: 2 },
			}),
			Placeholder.configure({ placeholder }),
			Underline,
			Superscript,
			Subscript,
			Highlight.configure({ multicolor: true }),
			TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { class: 'text-accent underline underline-offset-2 hover:text-accent-hover cursor-pointer' },
			}),
			Image.configure({
				HTMLAttributes: { class: 'rounded-xl mx-auto max-w-full', loading: 'lazy' },
				allowBase64: true,
			}),
			Youtube.configure({
				HTMLAttributes: { class: 'not-prose my-6 aspect-video overflow-hidden border border-border w-full' },
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
				class: 'tiptap-content prose prose-lg dark:prose-invert max-w-none outline-none min-h-[480px] px-6 py-5',
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
			isInternalUpdate.current = true;
			onChange(e.getHTML());
			// Reset the flag after React finishes processing
			queueMicrotask(() => { isInternalUpdate.current = false; });
		},
	});

	const handleImageFile = useCallback(async (file: File) => {
		if (!editor || !onImageUpload) return;
		setIsUploading(true);
		try {
			const url = await onImageUpload(file);
			editor.chain().focus().setImage({ src: url }).run();
		} catch {
			/* toast? */
		} finally {
			setIsUploading(false);
		}
	}, [editor, onImageUpload]);

	// Sync external content changes (e.g. draft load) into the editor.
	// Only update if the editor content is truly different from the prop.
	const isInternalUpdate = useRef(false);
	useEffect(() => {
		if (!editor || isInternalUpdate.current) return;
		const currentHtml = editor.getHTML();
		// Only set content if it actually differs (avoids cursor-reset loops)
		if (content !== currentHtml) {
			editor.commands.setContent(content, false);
		}
	}, [editor, content]);

	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleLinkSubmit = useCallback((url: string) => {
		if (!editor) return;
		setShowLinkDialog(false);
		if (!url) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const href = url.startsWith('http') ? url : `https://${url}`;
		editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
	}, [editor]);

	const addYoutube = useCallback(() => {
		if (!editor) return;
		const url = window.prompt('YouTube URL:');
		if (url) {
			editor.commands.setYoutubeVideo({ src: url });
		}
	}, [editor]);

	const addTable = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}, [editor]);

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
				<Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4h4l-2 16H8l2-16z" opacity=".2" /><path d="M10 4v2h2.58l-3.66 12H6v2h8v-2h-2.58l3.66-12H18V4h-8z" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3v7a6 6 0 0012 0V3h-2v7a4 4 0 01-8 0V3H6zM4 20h16v2H4v-2z" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12h18v1H3v-1zm4.5-3.5C7.5 6.5 9.5 5 12 5c2 0 3.5.8 4 2h2c-.7-2.3-3-4-6-4-3.5 0-6 2-6 5h2.5zm5 7c-2 0-3.5-.8-4-2H7c.7 2.3 3 4 6 4 3.5 0 6-2 6-5h-2.5c0 2-2 3.5-4.5 3.5z" opacity=".8" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
					<span className="text-[10px] font-bold">X<sup className="text-[8px]">²</sup></span>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
					<span className="text-[10px] font-bold">X<sub className="text-[8px]">₂</sub></span>
				</Btn>

				<Sep />

				{/* Headings */}
				<Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
					<span className="text-[10px] font-black">H1</span>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
					<span className="text-[10px] font-black">H2</span>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
					<span className="text-[10px] font-black">H3</span>
				</Btn>

				<Sep />

				{/* Lists */}
				<Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="7" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="4" cy="17" r="1.5" /><rect x="8" y="6" width="13" height="2" rx="1" /><rect x="8" y="11" width="13" height="2" rx="1" /><rect x="8" y="16" width="13" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><text x="2" y="9" fontSize="7" fontWeight="700">1</text><text x="2" y="14.5" fontSize="7" fontWeight="700">2</text><text x="2" y="20" fontSize="7" fontWeight="700">3</text><rect x="8" y="6" width="13" height="2" rx="1" /><rect x="8" y="11" width="13" height="2" rx="1" /><rect x="8" y="16" width="13" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.173 11 15c0 1.933-1.567 3.5-3.5 3.5-1.172 0-2.294-.555-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.173 21 15c0 1.933-1.567 3.5-3.5 3.5-1.172 0-2.294-.555-2.917-1.179z" /></svg>
				</Btn>

				<Sep />

				{/* Alignment */}
				<Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2" rx="1" /><rect x="3" y="9" width="12" height="2" rx="1" /><rect x="3" y="14" width="16" height="2" rx="1" /><rect x="3" y="19" width="10" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2" rx="1" /><rect x="6" y="9" width="12" height="2" rx="1" /><rect x="4" y="14" width="16" height="2" rx="1" /><rect x="7" y="19" width="10" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2" rx="1" /><rect x="9" y="9" width="12" height="2" rx="1" /><rect x="5" y="14" width="16" height="2" rx="1" /><rect x="11" y="19" width="10" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2" rx="1" /><rect x="3" y="9" width="18" height="2" rx="1" /><rect x="3" y="14" width="18" height="2" rx="1" /><rect x="3" y="19" width="18" height="2" rx="1" /></svg>
				</Btn>

				<Sep />

				{/* Insert */}
				<Btn onClick={() => setShowLinkDialog(!showLinkDialog)} active={editor.isActive('link')} title="Link (⌘K)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" /></svg>
				</Btn>
				<Btn onClick={openFileDialog} title="Chèn ảnh" disabled={isUploading}>
					{isUploading ? (
						<span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-accent" />
					) : (
						<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity=".4" /><path d="M21 15l-5-5L5 21" /></svg>
					)}
				</Btn>
				<Btn onClick={addYoutube} title="Chèn YouTube">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.5 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>
				</Btn>
				<Btn onClick={addTable} title="Chèn bảng">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="11" width="20" height="2" rx="1" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3l-4 18" strokeLinecap="round" /></svg>
				</Btn>

				<Sep />

				{/* Spacer */}
				<div className="flex-1" />

				{/* Undo / Redo */}
				<Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H9" strokeLinecap="round" /><path d="M7 6L3 10l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
				</Btn>
				<Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h6" strokeLinecap="round" /><path d="M17 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
				</Btn>

				<Sep />

				{/* Source HTML view toggle */}
				<Btn onClick={toggleSourceView} active={showSourceView} title="Xem/chỉnh HTML source">
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><path d="M14 2v6h6" /><path d="M9 13l-2 2 2 2M15 13l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
				</Btn>
			</div>



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

			{/* ═══ Editor / Source View ═══ */}
			{showSourceView ? (
				<textarea
					value={sourceHtml}
					onChange={(e) => setSourceHtml(e.target.value)}
					className="min-h-[480px] w-full bg-surface p-6 font-mono text-sm text-foreground outline-none"
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
				<div className="flex flex-wrap items-center gap-1 border-t border-border bg-surface-secondary/50 px-3 py-1.5 text-[10px] font-medium text-muted">
					<span className="mr-1 text-foreground-secondary">Bảng:</span>
					<button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="rounded px-1.5 py-0.5 hover:bg-surface-hover hover:text-foreground">+ Cột</button>
					<button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="rounded px-1.5 py-0.5 hover:bg-surface-hover hover:text-foreground">+ Hàng</button>
					<button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error">- Cột</button>
					<button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error">- Hàng</button>
					<button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="rounded px-1.5 py-0.5 hover:bg-surface-hover text-error">Xoá bảng</button>
				</div>
			)}
		</div>
	);
}
