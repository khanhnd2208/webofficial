'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import adminStyles from '@/components/admin/AdminStudio.module.css';

import { routes } from '@/config/routes';
import type { AdminLearnCourse } from '@/features/learn/adminCatalog';
import { absoluteWhen, relativeWhen } from '@/features/learn/formatWhen';
import { normalizeSearch } from '@/features/learn/search';

const FILTERS = [
	{ id: 'ALL', label: 'Tất cả' },
	{ id: 'DRAFT', label: 'Bản nháp' },
	{ id: 'PUBLISHED', label: 'Đã xuất bản' },
	{ id: 'ARCHIVED', label: 'Lưu trữ' },
] as const;

const STATUS_LABEL = {
	DRAFT: 'Bản nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Lưu trữ',
} as const;

export default function LearnCourseAdminList({ courses }: { courses: AdminLearnCourse[] }) {
	const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('ALL');
	const [query, setQuery] = useState('');
	const counts = useMemo(() => {
		const tally = { ALL: courses.length, DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
		for (const course of courses) tally[course.status] += 1;
		return tally;
	}, [courses]);
	const visible = courses.filter((course) => {
		if (filter !== 'ALL' && course.status !== filter) return false;
		const needle = normalizeSearch(query.trim());
		return !needle || normalizeSearch(course.title).includes(needle);
	});

	return (
		<section className={`ln-admin ${adminStyles.theme}`} aria-label="Quản lý khóa học">
			<div className="ln-segmented" role="tablist" aria-label="Trạng thái">
				{FILTERS.map((item) => (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={filter === item.id}
						onClick={() => setFilter(item.id)}
					>
						{item.label} <span className="tabular-nums">{counts[item.id]}</span>
					</button>
				))}
			</div>
			<label className="ln-admin__search">
				<span className="sr-only">Tìm khóa học</span>
				<input
					className="ln-input"
					value={query}
					placeholder="Tìm khóa học"
					onChange={(event) => setQuery(event.target.value)}
				/>
			</label>
			<ul className="ln-admin__list">
				{visible.map((course) => (
					<li key={course.id} className="ln-admin__row">
						<div>
							<p className="font-medium">{course.title}</p>
							<p className="text-sm text-ink-secondary">
								{STATUS_LABEL[course.status]} ·{' '}
								<span className="tabular-nums">
									{course.lessonCount} bài · {course.sectionCount} mục · {course.questionCount} câu
									phản biện
								</span>
							</p>
							<p className="text-sm text-ink-secondary">
								Sửa lần cuối {relativeWhen(course.lastEditedAt)} ·{' '}
								{absoluteWhen(course.lastEditedAt)}
							</p>
						</div>
						<div className="ln-admin__actions">
							<Link href={routes.learnStudio(course.slug)} className="ln-btn ln-btn--primary">
								Soạn
							</Link>
							<Link href={routes.learnCourse(course.slug)} className="ln-btn">
								Xem
							</Link>
						</div>
					</li>
				))}
			</ul>
			{visible.length === 0 ? <p className="ln-empty-hint">Không có khóa học phù hợp.</p> : null}
		</section>
	);
}
