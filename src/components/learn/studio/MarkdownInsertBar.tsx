'use client';

import type { RefObject } from 'react';

import {
	CALLOUT_SNIPPETS,
	insertSnippet,
	READING_SNIPPETS,
	type MarkdownSnippet,
} from '@/features/learn/markdownSnippets';

import { StudioIcon } from './icons';
import StudioMenu from './StudioMenu';

/**
 * Quick-insert row above the Markdown textarea. Inserts at the cursor (wrapping the
 * selection where it makes sense) and puts the caret where typing should continue.
 */
export default function MarkdownInsertBar({
	textareaRef,
	value,
	onChange,
	previewShown,
	onTogglePreview,
	showPreviewToggle = true,
	onOpenHelp,
}: {
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	value: string;
	onChange: (next: string) => void;
	previewShown: boolean;
	onTogglePreview: () => void;
	showPreviewToggle?: boolean;
	onOpenHelp?: () => void;
}) {
	function insert(snippet: MarkdownSnippet) {
		const area = textareaRef.current;
		const start = area?.selectionStart ?? value.length;
		const end = area?.selectionEnd ?? start;
		const result = insertSnippet(value, start, end, snippet);
		onChange(result.value);
		requestAnimationFrame(() => {
			const target = textareaRef.current;
			if (!target) return;
			target.focus();
			target.setSelectionRange(result.caret, result.caret);
		});
	}

	return (
		<div className="ln-mdbar" role="toolbar" aria-label="Chèn Markdown">
			<StudioMenu
				label="Chèn định dạng Markdown"
				triggerClassName="ln-mdbar__btn"
				trigger={<>Chèn định dạng</>}
				items={READING_SNIPPETS.map((snippet) => ({
					label: snippet.label,
					onSelect: () => insert(snippet),
				}))}
			/>
			<StudioMenu
				label="Chèn khối nổi bật"
				triggerClassName="ln-mdbar__btn"
				trigger={
					<>
						<StudioIcon name="callout" size={14} /> Khối
					</>
				}
				items={CALLOUT_SNIPPETS.map((snippet) => ({
					label: snippet.label,
					hint: snippet.text.split('\n')[0].replace(/▍/g, ''),
					onSelect: () => insert(snippet),
				}))}
			/>
			<span className="ln-mdbar__spacer" />
			{onOpenHelp ? (
				<button type="button" className="ln-mdbar__btn" onClick={onOpenHelp}>
					<StudioIcon name="help" size={14} /> Cú pháp
				</button>
			) : null}
			{showPreviewToggle ? (
				<button
					type="button"
					className="ln-mdbar__btn"
					aria-pressed={previewShown}
					onClick={onTogglePreview}
				>
					<StudioIcon name="eye" size={14} /> {previewShown ? 'Ẩn xem trước' : 'Xem trước'}
				</button>
			) : null}
		</div>
	);
}
