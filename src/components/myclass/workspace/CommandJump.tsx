'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { routes } from '@/config/routes';
import type { MyClassCourseDetail, MyClassTestListItem, MyClassVocabSetCard } from '@/features/my-class/types';
import type { MyClassOutlineItem } from '@/features/my-class/domain/learnerState';
import { toOutlineItemLink } from '@/features/my-class/domain/learnerState';
import { isLearnerVisibleTest, outlineTestKey } from '@/features/my-class/domain/outlineTests';
import { McDialog } from '@/components/myclass/ui';

type JumpItem = {
	id: string;
	kind: 'unit' | 'test' | 'vocab';
	title: string;
	subtitle: string;
	href: string;
	onSelect?: () => void;
};

export default function CommandJump({
	open,
	onClose,
	course,
	items,
	vocabSets,
	onOpenUnit,
	onOpenTest,
	includeUnpublished = false,
}: {
	open: boolean;
	onClose: () => void;
	course: MyClassCourseDetail;
	items: MyClassOutlineItem[];
	vocabSets: MyClassVocabSetCard[];
	onOpenUnit: (item: MyClassOutlineItem) => void;
	onOpenTest?: (test: MyClassTestListItem) => void;
	includeUnpublished?: boolean;
}) {
	const [query, setQuery] = useState('');
	const [wasOpen, setWasOpen] = useState(open);
	const inputRef = useRef<HTMLInputElement>(null);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (!open) setQuery('');
	}

	useEffect(() => {
		if (!open) return;
		const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
		return () => window.cancelAnimationFrame(frame);
	}, [open]);

	const catalog = useMemo(() => {
		const list: JumpItem[] = [];
		const seen = new Set<string>();
		for (const item of items) {
			const key = `${item.sectionId}:${item.knowledgeUnitId}`;
			if (seen.has(key)) continue;
			seen.add(key);
			list.push({
				id: key,
				kind: 'unit',
				title: item.title,
				subtitle: `${item.lessonTitle} · ${item.sectionTitle}`,
				href: toOutlineItemLink(item, items).href,
				onSelect: () => onOpenUnit(item),
			});
		}
		const outlineTests = [
			...course.tests,
			...course.lessons.flatMap((lesson) => [
				...lesson.tests,
				...lesson.sections.flatMap((section) => section.tests),
			]),
		];
		for (const test of outlineTests) {
			if (!includeUnpublished && !isLearnerVisibleTest(test)) continue;
			const id = `test:${outlineTestKey(test)}`;
			if (seen.has(id)) continue;
			seen.add(id);
			list.push({
				id,
				kind: 'test',
				title: test.title,
				subtitle: isLearnerVisibleTest(test)
					? `Test · ${test.questionCount} câu`
					: `Nháp · ${test.questionCount} câu`,
				href: routes.myClassTest(course.slug, test.slug),
				onSelect: onOpenTest ? () => onOpenTest(test) : undefined,
			});
		}
		for (const set of vocabSets.filter((row) => !row.isArchived)) {
			list.push({
				id: `vocab:${set.assignmentId}`,
				kind: 'vocab',
				title: set.title,
				subtitle: `Từ vựng · ${set.wordCount} từ`,
				href: routes.myClassVocab(course.slug, set.vocabSetId),
			});
		}
		return list;
	}, [course, includeUnpublished, items, onOpenTest, onOpenUnit, vocabSets]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return catalog.slice(0, 12);
		return catalog
			.filter(
				(item) =>
					item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
			)
			.slice(0, 20);
	}, [catalog, query]);

	return (
		<McDialog open={open} onClose={onClose} title="Tìm trong khóa học" description="Gõ để nhảy tới nội dung, test hoặc từ vựng.">
			<input
				ref={inputRef}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Tìm bài, nội dung, test…"
				className="mt-2 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
				aria-label="Tìm trong khóa học"
			/>
			<ul className="mt-3 max-h-80 space-y-1 overflow-y-auto" role="listbox">
				{filtered.length === 0 ? (
					<li className="px-3 py-4 text-sm text-ink-secondary">Không có kết quả.</li>
				) : (
					filtered.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								role="option"
								aria-selected={false}
								className="flex w-full min-h-11 flex-col px-3 py-2 text-left hover:bg-surface-sunken"
								onClick={() => {
									if (item.onSelect) item.onSelect();
									else window.location.href = item.href;
									onClose();
								}}
							>
								<span className="text-sm font-semibold text-ink">{item.title}</span>
								<span className="text-xs text-ink-secondary">{item.subtitle}</span>
							</button>
						</li>
					))
				)}
			</ul>
			<p className="mt-3 text-xs text-ink-secondary">Phím tắt: / hoặc ⌘K</p>
		</McDialog>
	);
}
