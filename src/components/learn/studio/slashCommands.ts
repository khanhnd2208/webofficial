import type { Editor } from '@tiptap/core';

import { CALLOUT_LABELS, type CalloutKind } from '@/features/learn/callouts';

export interface SlashCommand {
	id: string;
	label: string;
	hint: string;
	group: 'Văn bản' | 'Khối học thuật' | 'Chèn';
	keywords: string;
	run: (editor: Editor) => void;
}

const CALLOUT_HINTS: Record<CalloutKind, string> = {
	definition: 'Khái niệm, thuật ngữ',
	quote: 'Trích tác giả, tác phẩm',
	example: 'Tình huống, case study',
	reflect: 'Câu hỏi thảo luận',
	note: 'Ghi chú bên lề',
	tip: 'Mẹo, gợi ý cách học',
	warning: 'Lưu ý, phê phán',
	important: 'Ý cốt lõi cần nhớ',
};

const callout = (kind: CalloutKind, keywords: string): SlashCommand => ({
	id: `callout-${kind}`,
	label: CALLOUT_LABELS[kind],
	hint: CALLOUT_HINTS[kind],
	group: 'Khối học thuật',
	keywords: `${kind} callout ${keywords}`,
	run: (editor) => editor.chain().focus().setCallout(kind).run(),
});

export const SLASH_COMMANDS: SlashCommand[] = [
	{
		id: 'h2',
		label: 'Tiêu đề lớn',
		hint: 'Đề mục cấp 2',
		group: 'Văn bản',
		keywords: 'heading h2 tieu de',
		run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
	},
	{
		id: 'h3',
		label: 'Tiêu đề nhỏ',
		hint: 'Đề mục cấp 3',
		group: 'Văn bản',
		keywords: 'heading h3 tieu de nho',
		run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
	},
	{
		id: 'bullet',
		label: 'Danh sách',
		hint: 'Gạch đầu dòng',
		group: 'Văn bản',
		keywords: 'list bullet danh sach gach',
		run: (editor) => editor.chain().focus().toggleBulletList().run(),
	},
	{
		id: 'ordered',
		label: 'Danh sách số',
		hint: '1. 2. 3.',
		group: 'Văn bản',
		keywords: 'ordered number danh sach so',
		run: (editor) => editor.chain().focus().toggleOrderedList().run(),
	},
	{
		id: 'blockquote',
		label: 'Trích đoạn',
		hint: 'Khối trích dẫn thường',
		group: 'Văn bản',
		keywords: 'quote blockquote trich doan',
		run: (editor) => editor.chain().focus().toggleBlockquote().run(),
	},
	callout('definition', 'dinh nghia khai niem thuat ngu'),
	callout('quote', 'trich dan danh ngon'),
	callout('example', 'vi du tinh huong case'),
	callout('reflect', 'suy ngam thao luan cau hoi'),
	callout('important', 'cot loi quan trong'),
	callout('note', 'ghi chu luu y info'),
	callout('tip', 'goi y meo'),
	callout('warning', 'canh bao phe phan'),
	{
		id: 'table',
		label: 'Bảng so sánh',
		hint: '3 cột, có hàng tiêu đề',
		group: 'Chèn',
		keywords: 'table bang so sanh',
		run: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
	},
	{
		id: 'hr',
		label: 'Đường kẻ',
		hint: 'Ngăn cách hai phần',
		group: 'Chèn',
		keywords: 'divider hr duong ke',
		run: (editor) => editor.chain().focus().setHorizontalRule().run(),
	},
];

export function foldVietnamese(value: string): string {
	return value
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

export function filterSlashCommands(query: string): SlashCommand[] {
	const needle = foldVietnamese(query.trim());
	if (!needle) return SLASH_COMMANDS;
	return SLASH_COMMANDS.filter((command) =>
		foldVietnamese(`${command.label} ${command.keywords}`).includes(needle),
	);
}
