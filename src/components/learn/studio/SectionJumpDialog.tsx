'use client';

import { useMemo, useState } from 'react';

import { normalizeSearch } from '@/features/learn/search';
import type { LearnStudioLesson } from '@/features/learn/types';

import StudioDialog from './StudioDialog';

export default function SectionJumpDialog({
	lessons,
	onClose,
	onJump,
}: {
	lessons: LearnStudioLesson[];
	onClose: () => void;
	onJump: (sectionId: string) => void;
}) {
	const [query, setQuery] = useState('');
	const [cursor, setCursor] = useState(0);
	const items = useMemo(() => {
		const needle = normalizeSearch(query.trim());
		return lessons.flatMap((lesson) =>
			lesson.sections
				.filter(
					(section) =>
						!needle || normalizeSearch(`${lesson.title} ${section.title}`).includes(needle),
				)
				.map((section) => ({ id: section.id, lesson: lesson.title, title: section.title })),
		);
	}, [lessons, query]);

	return (
		<StudioDialog title="Chuyển tới mục" size="narrow" onClose={onClose}>
			<input
				autoFocus
				className="ln-input"
				aria-label="Lọc mục"
				value={query}
				placeholder="Tên bài hoặc tên mục"
				onChange={(event) => {
					setQuery(event.target.value);
					setCursor(0);
				}}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						setCursor((current) => Math.min(items.length - 1, current + 1));
					}
					if (event.key === 'ArrowUp') {
						event.preventDefault();
						setCursor((current) => Math.max(0, current - 1));
					}
					if (event.key === 'Enter' && items[cursor]) {
						event.preventDefault();
						onJump(items[cursor].id);
					}
				}}
			/>
			{!items.length ? <p role="status">Không tìm thấy bài hoặc mục phù hợp.</p> : null}
			<ul className="ln-jump" role="listbox" aria-label="Các mục phù hợp">
				{items.map((item, index) => (
					<li key={item.id}>
						<button
							type="button"
							role="option"
							aria-selected={index === cursor}
							onClick={() => onJump(item.id)}
						>
							{item.lesson} · {item.title}
						</button>
					</li>
				))}
			</ul>
		</StudioDialog>
	);
}
