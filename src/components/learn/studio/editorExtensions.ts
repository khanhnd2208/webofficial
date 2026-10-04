import Placeholder from '@tiptap/extension-placeholder';
import { TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import { BlockGrip } from './blockGrip';
import { Callout } from './calloutExtension';
import { FootnoteDef, FootnoteRef } from './footnoteExtension';
import { LearnImage } from './imageExtension';
import { LearnTable } from './tableMarkdown';

/**
 * The studio editor's extension set, shared with the markdown round-trip tests so a
 * fidelity fix (or regression) is verified against the exact config the studio ships.
 */
export function learnEditorExtensions() {
	return [
		StarterKit.configure({
			heading: { levels: [2, 3, 4] },
			underline: false,
			link: { openOnClick: false, autolink: true },
		}),
		LearnTable.configure({ resizable: false }),
		TableRow,
		TableHeader,
		TableCell,
		LearnImage.configure({ inline: false, allowBase64: true }),
		FootnoteRef,
		FootnoteDef,
		Placeholder.configure({
			placeholder: ({ node }) =>
				node.type.name === 'paragraph'
					? 'Viết nội dung, hoặc gõ / để chèn định nghĩa, trích dẫn, bảng…'
					: '',
		}),
		Callout,
		BlockGrip,
		Markdown.configure({ markedOptions: { gfm: true, breaks: true }, indentation: { size: 4 } }),
	];
}
