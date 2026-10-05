'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { CALLOUT_KINDS, CALLOUT_LABELS } from '@/features/learn/callouts';
import { StudioIcon, type StudioIconName } from './icons';

function ToolButton({
	icon,
	label,
	active,
	disabled,
	expanded,
	onClick,
}: {
	icon: StudioIconName;
	label: string;
	active?: boolean;
	disabled?: boolean;
	expanded?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className="ln-tool"
			aria-label={label}
			title={label}
			aria-pressed={active}
			aria-expanded={expanded}
			aria-haspopup={expanded === undefined ? undefined : 'menu'}
			disabled={disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
		>
			<StudioIcon name={icon} />
		</button>
	);
}

export default function EditorToolbar({
	editor,
	onPickImage,
}: {
	editor: Editor;
	onPickImage: () => void;
}) {
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
	const linkRef = useRef<HTMLDivElement>(null);
	const calloutRef = useRef<HTMLDivElement>(null);
	const firstCalloutRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!linkOpen && !calloutOpen) return;
		const onPointer = (event: PointerEvent) => {
			if (!(event.target instanceof Node)) return;
			if (!linkRef.current?.contains(event.target)) setLinkOpen(false);
			if (!calloutRef.current?.contains(event.target)) setCalloutOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			setLinkOpen(false);
			setCalloutOpen(false);
			editor.commands.focus(undefined, { scrollIntoView: false });
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	}, [linkOpen, calloutOpen, editor]);
	useEffect(() => {
		if (calloutOpen) firstCalloutRef.current?.focus();
	}, [calloutOpen]);

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
			<ToolButton
				icon="bold"
				label="Đậm (⌘B)"
				active={state.bold}
				onClick={() => editor.chain().focus().toggleBold().run()}
			/>
			<ToolButton
				icon="italic"
				label="Nghiêng (⌘I)"
				active={state.italic}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			/>
			<ToolButton
				icon="strike"
				label="Gạch ngang"
				active={state.strike}
				onClick={() => editor.chain().focus().toggleStrike().run()}
			/>
			<div ref={linkRef} className="relative">
				<ToolButton
					icon="link"
					label={state.link ? 'Bỏ liên kết' : 'Chèn liên kết'}
					active={state.link || linkOpen}
					onClick={toggleLink}
				/>
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
						<button
							type="button"
							onClick={() => {
								setLinkOpen(false);
								editor.commands.focus();
							}}
						>
							Hủy
						</button>
					</form>
				) : null}
			</div>
			<span className="ln-toolbar__sep" />
			<ToolButton
				icon="list"
				label="Danh sách"
				active={state.bullet}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			/>
			<ToolButton
				icon="ordered"
				label="Danh sách số"
				active={state.ordered}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			/>
			<ToolButton
				icon="quote"
				label="Trích đoạn"
				active={state.quote}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			/>
			<div ref={calloutRef} className="relative">
				<ToolButton
					icon="callout"
					label="Khối học thuật"
					active={state.callout || calloutOpen}
					expanded={calloutOpen}
					onClick={() => setCalloutOpen((value) => !value)}
				/>
				{calloutOpen ? (
					<div className="ln-popover" role="group" aria-label="Chọn khối học thuật">
						{CALLOUT_KINDS.map((kind, index) => (
							<button
								key={kind}
								ref={index === 0 ? firstCalloutRef : undefined}
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
			<ToolButton
				icon="table"
				label="Chèn bảng"
				onClick={() =>
					editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
				}
			/>
			<ToolButton icon="image" label="Chèn ảnh" onClick={onPickImage} />
			<ToolButton
				icon="hr"
				label="Đường kẻ"
				onClick={() => editor.chain().focus().setHorizontalRule().run()}
			/>
			{state.table ? (
				<span className="ln-toolbar__group">
					<button
						type="button"
						className="ln-tool ln-tool--text"
						onClick={() => editor.chain().focus().addRowAfter().run()}
					>
						+ Hàng
					</button>
					<button
						type="button"
						className="ln-tool ln-tool--text"
						onClick={() => editor.chain().focus().addColumnAfter().run()}
					>
						+ Cột
					</button>
					<button
						type="button"
						className="ln-tool ln-tool--text"
						onClick={() => editor.chain().focus().deleteRow().run()}
					>
						− Hàng
					</button>
					<button
						type="button"
						className="ln-tool ln-tool--text"
						onClick={() => editor.chain().focus().deleteColumn().run()}
					>
						− Cột
					</button>
					<button
						type="button"
						className="ln-tool ln-tool--text"
						onClick={() => editor.chain().focus().deleteTable().run()}
					>
						Xóa bảng
					</button>
				</span>
			) : null}
			<span className="ml-auto" />
			<ToolButton
				icon="undo"
				label="Hoàn tác (⌘Z)"
				disabled={!state.canUndo}
				onClick={() => editor.chain().focus().undo().run()}
			/>
			<ToolButton
				icon="redo"
				label="Làm lại (⇧⌘Z)"
				disabled={!state.canRedo}
				onClick={() => editor.chain().focus().redo().run()}
			/>
		</div>
	);
}
