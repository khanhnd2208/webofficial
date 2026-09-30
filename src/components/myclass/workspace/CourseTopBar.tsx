'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { routes } from '@/config/routes';
import { McIcon, McMeter } from '@/components/myclass/ui';

export default function CourseTopBar({
	courseSlug,
	courseTitle,
	percent,
	completed,
	total,
	lessons,
	activeLessonSlug,
	onSelectLesson,
	outlineCollapsed,
	onToggleOutline,
	onSearch,
	desktop,
	actions,
	editMode = false,
	editSummary,
	hasVocab = false,
}: {
	courseSlug: string;
	courseTitle: string;
	percent: number;
	completed: number;
	total: number;
	lessons: Array<{ slug: string; title: string; position: number }>;
	activeLessonSlug: string | null;
	onSelectLesson: (slug: string) => void;
	outlineCollapsed: boolean;
	onToggleOutline: () => void;
	onSearch: () => void;
	desktop: boolean;
	actions?: ReactNode;
	editMode?: boolean;
	editSummary?: string;
	hasVocab?: boolean;
}) {
	const catalogLink = (
		<Link
			href={routes.myClass}
			aria-label="Tất cả khóa học"
			title="Tất cả khóa học"
			className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
		>
			<McIcon name="arrow_back" size={22} />
		</Link>
	);

	if (!desktop) {
		return (
			<header
				data-testid="my-class-topbar"
				className="relative sticky top-0 z-40 grid h-14 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center border-b border-mc-rule/50 bg-paper px-2"
			>
				{catalogLink}
				<Link
					href={routes.myClassCourse(courseSlug)}
					aria-label={`${courseTitle}, ${completed}/${total} nội dung đã hoàn thành`}
					className="min-w-0 rounded-[var(--mc-r-xs)] px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<span className="block truncate text-center text-[16px] font-bold leading-6 text-ink">
						{courseTitle}
					</span>
				</Link>
				<span aria-hidden />
				{actions ? (
					<div className="absolute right-2 top-1/2 -translate-y-1/2">{actions}</div>
				) : null}
			</header>
		);
	}

	return (
		<header
			data-testid="my-class-topbar"
			className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-mc-rule bg-paper px-4 shadow-[var(--mc-shadow-1)] md:px-10"
		>
			<div className="flex min-w-0 flex-1 items-center gap-2">
				{catalogLink}
				<button
					type="button"
					onClick={onToggleOutline}
					className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent hover:bg-surface-container"
					aria-label={outlineCollapsed ? 'Hiện mục lục' : 'Ẩn mục lục'}
					aria-pressed={!outlineCollapsed}
					title="⌘\\"
				>
					<McIcon name="menu" size={24} />
				</button>
				<Link
					href={routes.myClassCourse(courseSlug)}
					aria-label={`${courseTitle}, ${completed}/${total} nội dung đã hoàn thành`}
					className="min-h-11 min-w-0 rounded-[var(--mc-r-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<span className="block truncate text-xl font-semibold leading-7 text-ink">
						{courseTitle}
					</span>
					{editMode ? (
						<p className="mc-meta mt-1">{editSummary}</p>
					) : (
						<div className="mt-1 flex w-48 max-w-[min(12rem,100%)] items-center gap-2">
							<McMeter value={percent} className="flex-1" label="Tiến độ khóa học" />
							<span className="mc-num shrink-0 text-[12px] font-semibold leading-4 text-ink-secondary">
								{completed}/{total}
							</span>
						</div>
					)}
				</Link>
			</div>
			<div className="flex shrink-0 items-center gap-4" data-testid="my-class-lesson-jump">
				{lessons.length > 1 ? (
					<label className="relative inline-flex min-w-0 max-w-[20rem] cursor-pointer items-center rounded-[var(--mc-r-sm)] border border-mc-rule bg-canvas pl-3 pr-8">
						<span
							aria-hidden
							className="pointer-events-none mr-2 shrink-0 text-[14px] font-medium leading-5 text-ink-secondary"
						>
							BÀI
						</span>
						<select
							aria-label="Chuyển bài học"
							value={activeLessonSlug ?? ''}
							onChange={(event) => onSelectLesson(event.target.value)}
							className="h-10 min-w-0 flex-1 cursor-pointer appearance-none truncate border-0 bg-transparent py-1.5 text-[14px] font-medium leading-5 text-ink outline-none"
						>
							{lessons.map((lesson) => (
								<option key={lesson.slug} value={lesson.slug}>
									{String(lesson.position + 1).padStart(2, '0')}. {lesson.title}
								</option>
							))}
						</select>
						<McIcon
							name="expand_more"
							size={20}
							className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary"
						/>
					</label>
				) : null}
				{hasVocab ? (
					<Link
						href={routes.myClassVocabIndex(courseSlug)}
						className="inline-flex h-10 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
					>
						Từ vựng
					</Link>
				) : null}
				<button
					type="button"
					onClick={onSearch}
					className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--mc-r-sm)] bg-ink text-paper shadow-sm hover:bg-inverse-surface"
					aria-label="Tìm trong khóa học"
					title="Tìm (/)"
				>
					<McIcon name="search" size={20} />
				</button>
				{actions}
			</div>
		</header>
	);
}
