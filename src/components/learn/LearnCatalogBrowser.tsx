'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';

import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/content';
import { courseHue, courseStatus, percentOf, type LearnCourseStatus } from '@/features/learn/progress';
import { LEARN_LEVEL_LABELS, type LearnCourseListItem, type LearnLevel } from '@/features/learn/types';

import { LearnCourseCover, LearnIcon } from './LearnIcon';

type Tab = 'all' | LearnCourseStatus;
type Sort = 'recommended' | 'recent' | 'progress' | 'title' | 'shortest';

const TABS: Array<{ id: Tab; label: string }> = [
	{ id: 'all', label: 'Tất cả' },
	{ id: 'in-progress', label: 'Đang học' },
	{ id: 'not-started', label: 'Chưa bắt đầu' },
	{ id: 'completed', label: 'Đã hoàn thành' },
];

const SORTS: Array<{ id: Sort; label: string }> = [
	{ id: 'recommended', label: 'Đề xuất' },
	{ id: 'recent', label: 'Học gần đây' },
	{ id: 'progress', label: 'Tiến độ cao nhất' },
	{ id: 'shortest', label: 'Ngắn nhất' },
	{ id: 'title', label: 'Tên A → Z' },
];

const STATUS_LABEL: Record<LearnCourseStatus, string> = {
	'not-started': 'Chưa bắt đầu',
	'in-progress': 'Đang học',
	completed: 'Đã hoàn thành',
};

function normalize(value: string) {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase();
}

export default function LearnCatalogBrowser({ courses }: { courses: LearnCourseListItem[] }) {
	const [tab, setTab] = useState<Tab>('all');
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState('');
	const [level, setLevel] = useState<LearnLevel | ''>('');
	const [sort, setSort] = useState<Sort>('recommended');
	const deferredQuery = useDeferredValue(query);

	const enriched = useMemo(
		() =>
			courses.map((course) => ({
				course,
				status: courseStatus(course.completedCount, course.sectionCount),
				percent: percentOf(course.completedCount, course.sectionCount),
				haystack: normalize(
					[course.title, course.subtitle, course.description, course.category].filter(Boolean).join(' '),
				),
			})),
		[courses],
	);

	const categories = useMemo(
		() => [...new Set(courses.map((course) => course.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
		[courses],
	);
	const levels = useMemo(() => [...new Set(courses.map((course) => course.level))], [courses]);

	const counts = useMemo(() => {
		const result: Record<Tab, number> = { all: enriched.length, 'not-started': 0, 'in-progress': 0, completed: 0 };
		for (const item of enriched) result[item.status] += 1;
		return result;
	}, [enriched]);

	const visible = useMemo(() => {
		const needle = normalize(deferredQuery.trim());
		const filtered = enriched.filter(
			(item) =>
				(tab === 'all' || item.status === tab) &&
				(!category || item.course.category === category) &&
				(!level || item.course.level === level) &&
				(!needle || item.haystack.includes(needle)),
		);
		const sorted = [...filtered];
		if (sort === 'recent') {
			sorted.sort((a, b) => (b.course.lastActivityAt ?? '').localeCompare(a.course.lastActivityAt ?? ''));
		} else if (sort === 'progress') {
			sorted.sort((a, b) => b.percent - a.percent);
		} else if (sort === 'title') {
			sorted.sort((a, b) => a.course.title.localeCompare(b.course.title, 'vi'));
		} else if (sort === 'shortest') {
			sorted.sort((a, b) => a.course.totalMinutes - b.course.totalMinutes);
		}
		return sorted;
	}, [enriched, tab, category, level, deferredQuery, sort]);

	const filtersActive = Boolean(query || category || level || tab !== 'all');

	function reset() {
		setTab('all');
		setQuery('');
		setCategory('');
		setLevel('');
	}

	return (
		<section aria-label="Danh sách khóa học" className="ln-browse">
			<div className="ln-tabs" role="tablist" aria-label="Lọc theo trạng thái">
				{TABS.map((item) => (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={tab === item.id}
						className="ln-tab"
						onClick={() => setTab(item.id)}
					>
						{item.label}
						<span className="ln-tab__count tabular-nums">{counts[item.id]}</span>
					</button>
				))}
			</div>

			<div className="ln-filters">
				<label className="ln-search">
					<LearnIcon name="search" size={17} />
					<span className="sr-only">Tìm khóa học</span>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên, chủ đề…"
					/>
				</label>
				{categories.length > 1 ? (
					<select
						className="ln-select"
						value={category}
						onChange={(event) => setCategory(event.target.value)}
						aria-label="Chủ đề"
					>
						<option value="">Mọi chủ đề</option>
						{categories.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
				) : null}
				{levels.length > 1 ? (
					<select
						className="ln-select"
						value={level}
						onChange={(event) => setLevel(event.target.value as LearnLevel | '')}
						aria-label="Trình độ"
					>
						<option value="">Mọi trình độ</option>
						{levels.map((item) => (
							<option key={item} value={item}>
								{LEARN_LEVEL_LABELS[item]}
							</option>
						))}
					</select>
				) : null}
				<select
					className="ln-select"
					value={sort}
					onChange={(event) => setSort(event.target.value as Sort)}
					aria-label="Sắp xếp"
				>
					{SORTS.map((item) => (
						<option key={item.id} value={item.id}>
							{item.label}
						</option>
					))}
				</select>
			</div>

			<p className="ln-browse__summary" aria-live="polite">
				{visible.length} khóa học
				{filtersActive ? (
					<button type="button" className="ln-link-btn" onClick={reset}>
						Xóa bộ lọc
					</button>
				) : null}
			</p>

			{visible.length ? (
				<ul className="ln-grid">
					{visible.map(({ course, status, percent }) => {
						const resumeHref = routes.learnCourse(course.slug, course.nextSectionId ?? undefined);
						return (
							<li key={course.id} className="ln-card">
								<Link href={routes.learnCourse(course.slug)} className="ln-card__cover-link" tabIndex={-1} aria-hidden="true">
									<LearnCourseCover hue={courseHue(course.slug)} title={course.title} category={course.category} />
								</Link>
								<div className="ln-card__body">
									<div className="ln-card__chips">
										<span className="ln-chip">{LEARN_LEVEL_LABELS[course.level]}</span>
										{course.status !== 'PUBLISHED' ? <span className="ln-chip ln-chip--draft">Bản nháp</span> : null}
										{status !== 'not-started' ? (
											<span className="ln-chip" data-status={status}>
												{STATUS_LABEL[status]}
											</span>
										) : null}
									</div>
									<h2 className="ln-card__title">
										<Link href={routes.learnCourse(course.slug)}>{course.title}</Link>
									</h2>
									{course.subtitle ? <p className="ln-card__subtitle">{course.subtitle}</p> : null}
									<p className="ln-card__meta">
										<span>
											<LearnIcon name="layers" size={14} /> {course.lessonCount} bài
										</span>
										<span>
											<LearnIcon name="reading" size={14} /> {course.sectionCount} mục
										</span>
										<span>
											<LearnIcon name="clock" size={14} /> {formatMinutes(course.totalMinutes)}
										</span>
										{course.quizCount ? (
											<span>
												<LearnIcon name="quiz" size={14} /> {course.quizCount} kiểm tra
											</span>
										) : null}
									</p>
									<div className="ln-card__foot">
										{status === 'not-started' ? (
											<span className="ln-card__hint">Chưa bắt đầu</span>
										) : (
											<div className="ln-card__progress">
												<div className="ln-bar" aria-hidden="true">
													<span style={{ width: `${percent}%` }} />
												</div>
												<span className="tabular-nums">{percent}%</span>
											</div>
										)}
										<Link
											href={status === 'completed' ? routes.learnCourse(course.slug) : resumeHref}
											className="ln-btn ln-btn--primary ln-btn--sm"
										>
											{status === 'completed' ? 'Ôn lại' : status === 'in-progress' ? 'Tiếp tục' : 'Bắt đầu'}
										</Link>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			) : (
				<div className="ln-empty">
					<LearnIcon name="search" size={28} />
					<p className="font-medium">Không có khóa học phù hợp</p>
					<p className="text-sm text-ink-secondary">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
					{filtersActive ? (
						<button type="button" className="ln-btn" onClick={reset}>
							Xóa bộ lọc
						</button>
					) : null}
				</div>
			)}
		</section>
	);
}
