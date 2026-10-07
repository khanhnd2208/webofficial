'use client';

import { useState } from 'react';

import {
	CALLOUT_SNIPPETS,
	IMPORT_SNIPPETS,
	READING_SNIPPETS,
	snippetText,
	type MarkdownSnippet,
} from '@/features/learn/markdownSnippets';

import StudioDialog from './StudioDialog';
import { ManualCopyField, useCopy } from './useCopy';

const SHORTCUTS: { keys: string; label: string }[] = [
	{ keys: '⌘/Ctrl S', label: 'Lưu ngay' },
	{ keys: '⌘/Ctrl K', label: 'Chuyển tới mục' },
	{ keys: '⌘/Ctrl ⇧ P', label: 'Xem như học viên' },
	{ keys: '/', label: 'Menu chèn khối (soạn trực quan)' },
	{ keys: '?', label: 'Mở bảng này' },
];

const GROUPS: { title: string; note?: string; snippets: MarkdownSnippet[] }[] = [
	{ title: 'Trong mục đọc', snippets: READING_SNIPPETS },
	{
		title: 'Khối nổi bật',
		note: 'Mỗi dòng của khối bắt đầu bằng >. Tiêu đề sau [!LOẠI] có thể bỏ trống.',
		snippets: CALLOUT_SNIPPETS,
	},
	{
		title: 'Khi dán vào “Nhập nội dung”',
		note: 'Mỗi dòng # tạo một bài; mỗi dòng === … === tạo một mục.',
		snippets: IMPORT_SNIPPETS,
	},
];

/** Shortcuts plus the Markdown the studio and the import box understand, each copyable. */
export default function StudioHelpDialog({
	initialTab = 'syntax',
	onClose,
}: {
	initialTab?: 'syntax' | 'shortcuts';
	onClose: () => void;
}) {
	const [tab, setTab] = useState(initialTab);
	const { copy, manual, clearManual } = useCopy();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	return (
		<StudioDialog title="Trợ giúp soạn bài" onClose={onClose}>
			<div className="ln-editor__modes" role="tablist" aria-label="Nội dung trợ giúp">
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'syntax'}
					onClick={() => setTab('syntax')}
				>
					Cú pháp Markdown
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'shortcuts'}
					onClick={() => setTab('shortcuts')}
				>
					Phím tắt
				</button>
			</div>
			{manual ? <ManualCopyField text={manual} /> : null}
			{tab === 'shortcuts' ? (
				<ul className="ln-shortcuts">
					{SHORTCUTS.map((item) => (
						<li key={item.keys}>
							<kbd className="ln-kbd">{item.keys}</kbd> {item.label}
						</li>
					))}
				</ul>
			) : (
				<div className="ln-cheats">
					{GROUPS.map((group) => (
						<section key={group.title} className="ln-cheats__group">
							<h3 className="ln-cheats__title">{group.title}</h3>
							{group.note ? <p className="ln-cheats__note">{group.note}</p> : null}
							<ul className="ln-cheats__list">
								{group.snippets.map((snippet) => (
									<li key={snippet.id} className="ln-cheats__row">
										<span className="ln-cheats__label">{snippet.label}</span>
										<pre className="ln-cheats__code">{snippetText(snippet)}</pre>
										<button
											type="button"
											className="ln-link-btn"
											aria-label={`Chép mẫu ${snippet.label}`}
											onClick={() => {
												clearManual();
												void copy(snippetText(snippet)).then(() => setCopiedId(snippet.id));
											}}
										>
											{copiedId === snippet.id ? 'Đã chép' : 'Chép'}
										</button>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			)}
		</StudioDialog>
	);
}
