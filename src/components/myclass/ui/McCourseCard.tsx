import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDuration } from '@/features/my-class/domain/estimateReading';
import type { MyClassCourseCard } from '@/features/my-class/types';
import { McBadge } from './McBadge';
import { McIcon } from './McIcon';
import { McMeter } from './McMeter';

const LEVEL_LABEL: Record<string, string> = {
	BEGINNER: 'Cơ bản',
	INTERMEDIATE: 'Trung cấp',
	ADVANCED: 'Nâng cao',
};

export function McCourseCover({
	url,
	title,
	className = '',
}: {
	url?: string | null;
	title: string;
	className?: string;
}) {
	return (
		<div className={`relative overflow-hidden bg-surface-sunken ${className}`}>
			{url ? (
				<img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
			) : (
				<div className="absolute inset-0 flex items-center justify-center" aria-hidden>
					<span className="mc-num text-4xl font-semibold text-ink-tertiary">
						{title.slice(0, 1).toUpperCase()}
					</span>
				</div>
			)}
		</div>
	);
}

export function McCourseCard({
	course,
	href,
	detailHref,
	percent = 0,
	cta = 'Bắt đầu',
	progressLoading = false,
	secondaryAction,
}: {
	course: MyClassCourseCard;
	href: string;
	detailHref?: string;
	percent?: number;
	cta?: string;
	progressLoading?: boolean;
	secondaryAction?: ReactNode;
}) {
	return (
		<article className="mc-surface mc-surface-interactive group flex min-w-0 flex-col overflow-hidden">
			<Link
				href={detailHref ?? href}
				aria-hidden="true"
				tabIndex={-1}
				className="block rounded-t-[var(--mc-r-md)]"
			>
				<McCourseCover
					url={course.thumbnailUrl}
					title={course.title}
					className="aspect-video w-full"
				/>
			</Link>
			<div className="flex flex-1 flex-col p-4 sm:p-5">
				<div className="flex min-h-6 flex-wrap gap-1.5">
					{course.level ? (
						<McBadge variant="level">{LEVEL_LABEL[course.level] ?? course.level}</McBadge>
					) : null}
					{course.tags.slice(0, 2).map((tag) => (
						<McBadge key={tag}>{tag}</McBadge>
					))}
				</div>
				<Link
					href={detailHref ?? href}
					className="mc-focus-ring mt-2 inline-flex min-h-11 items-center rounded-[var(--mc-r-xs)]"
				>
					<h3 className="text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
						{course.title}
					</h3>
				</Link>
				<p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-secondary">
					{course.summary || course.description || 'Nội dung đang được cập nhật.'}
				</p>
				<p className="mc-meta mt-4">
					{course.lessonCount ?? '—'} bài
					{course.unitCount != null ? ` · ${course.unitCount} nội dung` : ''}
					{course.estimatedMinutes != null ? ` · ${formatDuration(course.estimatedMinutes)}` : ''}
				</p>
				<div className="mt-auto pt-5">
					<div className="mb-2 flex items-center justify-between gap-3 text-xs">
						<span className="font-medium text-ink-secondary">Tiến độ</span>
						<span className="mc-num font-semibold text-ink">
							{progressLoading ? 'Đang tải' : `${percent}%`}
						</span>
					</div>
					{progressLoading ? (
						<div
							className="h-1 animate-pulse rounded-full bg-surface-container-high motion-reduce:animate-none"
							aria-hidden
						/>
					) : (
						<McMeter value={percent} label={`Tiến độ ${course.title}`} />
					)}
					<Link
						href={href}
						className="mc-focus-ring mt-4 inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] font-semibold text-ink group-hover:text-accent"
					>
						{cta}
						<McIcon name="arrow_forward" size={18} className="ml-1" />
					</Link>
					{secondaryAction ? (
						<div className="border-t border-mc-rule pt-3">{secondaryAction}</div>
					) : null}
				</div>
			</div>
		</article>
	);
}

/** Compact horizontal course row used on the hub catalog. */
export function McCourseRow({
	course,
	href,
	percent = 0,
	progressLoading = false,
}: {
	course: MyClassCourseCard;
	href: string;
	percent?: number;
	progressLoading?: boolean;
}) {
	const done = !progressLoading && percent >= 100;
	const summary = course.summary || course.description || 'Nội dung đang được cập nhật.';
	const meta = [
		course.lessonCount != null ? `${course.lessonCount} bài` : null,
		course.estimatedMinutes != null ? formatDuration(course.estimatedMinutes) : null,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<Link
			href={href}
			className="mc-surface mc-surface-interactive group flex min-w-0 items-center gap-4 p-4"
		>
			<McCourseCover
				url={course.thumbnailUrl}
				title={course.title}
				className="h-24 w-24 shrink-0 rounded-[var(--mc-r-sm)]"
			/>
			<div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between">
				<div className="min-w-0">
					<div className="mb-1.5 flex flex-wrap gap-1.5">
						{course.level ? (
							<McBadge variant="level">{LEVEL_LABEL[course.level] ?? course.level}</McBadge>
						) : null}
						{course.tags.slice(0, 2).map((tag) => (
							<McBadge key={tag}>{tag}</McBadge>
						))}
					</div>
					<h3 className="truncate text-base font-semibold leading-6 text-ink transition-colors group-hover:text-accent">
						{course.title}
					</h3>
					<p className="mt-0.5 truncate text-xs font-semibold leading-4 text-ink-secondary">
						{summary}
					</p>
				</div>
				<div className="mt-2">
					<div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-ink-secondary">
						<span className={`font-medium ${done ? 'text-mc-done' : ''}`}>
							{progressLoading ? 'Đang tải' : `${percent}% Hoàn thành`}
						</span>
						{meta ? <span className="shrink-0">{meta}</span> : null}
					</div>
					{progressLoading ? (
						<div
							className="h-1.5 animate-pulse rounded-full bg-surface-container-high motion-reduce:animate-none"
							aria-hidden
						/>
					) : (
						<McMeter
							value={percent}
							tone={done ? 'done' : 'accent'}
							label={`Tiến độ ${course.title}`}
						/>
					)}
				</div>
			</div>
		</Link>
	);
}
