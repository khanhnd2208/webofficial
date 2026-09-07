'use client';

import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
	RECALL_TEXT_COLORS,
	recallMarkdownToHtml,
	recallToStoredHtml,
	sanitizeRecallHtml,
} from '@/features/active-recall/richText';

function equivalentHtml(left: string, right: string) {
	return sanitizeRecallHtml(left) === sanitizeRecallHtml(right);
}

function ToolButton({
	onClick,
	active,
	label,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onMouseDown={(event) => {
				event.preventDefault();
			}}
			onClick={onClick}
			title={label}
			aria-label={label}
			aria-pressed={active}
			className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
				active
					? 'bg-foreground text-background'
					: 'text-muted hover:bg-background hover:text-foreground'
			}`}
		>
			{children}
		</button>
	);
}

export default function RecallRichTextEditor({
	value,
	onChange,
	placeholder,
	labelledBy,
}: {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	labelledBy?: string;
}) {
	const valueRef = useRef(value);
	const editorRef = useRef<Editor | null>(null);
	const isInternalUpdate = useRef(false);
	const [openColors, setOpenColors] = useState(false);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: false,
				code: false,
				codeBlock: false,
				blockquote: false,
				horizontalRule: false,
				strike: false,
				link: false,
				underline: false,
			}),
			Placeholder.configure({ placeholder: placeholder ?? '' }),
			Underline,
			TextStyle,
			Color,
		],
		content: recallToStoredHtml(value) || '<p></p>',
		editorProps: {
			attributes: {
				class: 'recall-card-editor min-h-[7.5rem] px-3 py-2 text-sm text-foreground outline-none',
				...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
			},
			handlePaste: (_view, event) => {
				const html = event.clipboardData?.getData('text/html') ?? '';
				const text = event.clipboardData?.getData('text/plain') ?? '';
				if (html && /<(p|strong|em|u|span|ul|ol|b|i)\b/i.test(html)) {
					event.preventDefault();
					editorRef.current?.commands.insertContent(sanitizeRecallHtml(html) || escapePlain(text));
					return true;
				}
				if (/(\*\*|__|(^|[^\w])\*[^\s*]|\b_[^_\s]|<u>|<span\s+style=)/i.test(text)) {
					event.preventDefault();
					editorRef.current?.commands.insertContent(recallMarkdownToHtml(text) || escapePlain(text));
					return true;
				}
				return false;
			},
		},
		onUpdate: ({ editor: instance }) => {
			const html = instance.getHTML();
			if (equivalentHtml(html, valueRef.current)) return;
			isInternalUpdate.current = true;
			onChange(html);
			queueMicrotask(() => {
				isInternalUpdate.current = false;
			});
		},
	});

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	useEffect(() => {
		editorRef.current = editor;
	}, [editor]);

	useEffect(() => {
		if (!editor || isInternalUpdate.current) return;
		const next = recallToStoredHtml(value) || '<p></p>';
		if (!equivalentHtml(next, editor.getHTML())) {
			editor.commands.setContent(next, { emitUpdate: false });
		}
	}, [editor, value]);

	const applyColor = useCallback(
		(color: string | null) => {
			if (!editor) return;
			if (color) editor.chain().focus().setColor(color).run();
			else editor.chain().focus().unsetColor().run();
			setOpenColors(false);
		},
		[editor],
	);

	if (!editor) return null;

	return (
		<div
			className="mt-2 overflow-hidden rounded-lg border border-border bg-background"
			onPointerDown={(event) => event.stopPropagation()}
			onDragStart={(event) => event.stopPropagation()}
		>
			<div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1 py-1">
				<ToolButton
					label="Đậm"
					active={editor.isActive('bold')}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<span className="font-serif font-black">B</span>
				</ToolButton>
				<ToolButton
					label="Nghiêng"
					active={editor.isActive('italic')}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<span className="font-serif italic">I</span>
				</ToolButton>
				<ToolButton
					label="Gạch chân"
					active={editor.isActive('underline')}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<span className="font-serif underline">U</span>
				</ToolButton>
				<ToolButton
					label="Danh sách chấm"
					active={editor.isActive('bulletList')}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<span aria-hidden="true">•≡</span>
				</ToolButton>
				<ToolButton
					label="Danh sách số"
					active={editor.isActive('orderedList')}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<span aria-hidden="true">1≡</span>
				</ToolButton>
				<ToolButton
					label="Màu chữ"
					active={openColors || editor.isActive('textStyle')}
					onClick={() => setOpenColors((value) => !value)}
				>
					<span
						className="font-serif font-bold leading-none"
						style={{
							color:
								(editor.getAttributes('textStyle').color as string | undefined) ??
								'currentColor',
						}}
					>
						A
					</span>
				</ToolButton>
			</div>
			{openColors ? (
				<div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2 py-1.5" role="group" aria-label="Màu chữ">
					{RECALL_TEXT_COLORS.map((color) => {
						const current = (editor.getAttributes('textStyle').color as string | undefined) ?? null;
						const selected = (current ?? null) === color.value;
						return (
							<button
								key={color.label}
								type="button"
								title={color.label}
								aria-label={`Màu chữ: ${color.label}`}
								aria-pressed={selected}
								onMouseDown={(event) => {
									event.preventDefault();
								}}
								onClick={() => applyColor(color.value)}
								className={`h-5 w-5 rounded-full border ${selected ? 'ring-2 ring-foreground ring-offset-1' : 'border-border'}`}
								style={color.value ? { backgroundColor: color.value } : undefined}
							>
								{color.value ? null : (
									<span className="block text-[10px] leading-5 text-muted">×</span>
								)}
							</button>
						);
					})}
				</div>
			) : null}
			<EditorContent editor={editor} />
		</div>
	);
}

function escapePlain(value: string) {
	return `<p>${value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')}</p>`;
}
