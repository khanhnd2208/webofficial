import Link from 'next/link';

import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/format';
import { LEARN_LEVEL_LABELS, type LearnLevel } from '@/features/learn/types';

import CourseCard from './CourseCard';

export interface DiscoverCoursePreview {
	slug: string;
	title: string;
	subtitle: string;
	description: string;
	category: string;
	level: LearnLevel;
	thumbnailUrl: string | null;
	lessonCount: number;
	totalMinutes: number;
	lessonTitles: string[];
}

export function courseBlurb(course: { subtitle: string; description: string }) {
	return course.subtitle.trim() || course.description.trim();
}

/** Level · category · lesson count · length, skipping whatever is missing. */
export function courseFacts(course: {
	level: LearnLevel;
	category: string;
	lessonCount: number;
	totalMinutes: number;
}) {
	return [
		LEARN_LEVEL_LABELS[course.level],
		course.category.trim(),
		`${course.lessonCount} bài`,
		course.totalMinutes > 0 ? `khoảng ${formatMinutes(course.totalMinutes)}` : '',
	].filter(Boolean);
}

/** The guest view of /khoa-hoc: every published course, with its syllabus one tap away. */
export default function DiscoverCourseList({ courses }: { courses: DiscoverCoursePreview[] }) {
	if (!courses.length) {
		return (
			<section className="mx-auto max-w-xl py-16 text-center">
				<SpotIllustration variant="empty" size={144} className="mx-auto" />
				<h2 className="mt-7 font-display text-title-1">Các khóa học đang được chuẩn bị</h2>
				<p className="mt-3 text-body leading-relaxed text-ink-secondary">
					Khi một khóa học được mở, bạn sẽ xem được nội dung ở đây.
				</p>
				<Link
					href={routes.toc}
					className="mt-8 inline-flex min-h-11 items-center border-b border-accent text-subhead font-medium text-ink"
				>
					Trở về mục lục
				</Link>
			</section>
		);
	}
	return (
		<section aria-label="Các khóa học" className="mt-6 flex flex-col gap-3">
			{courses.map((course) => (
				<CourseCard
					key={course.slug}
					slug={course.slug}
					title={course.title}
					blurb={courseBlurb(course)}
					facts={courseFacts(course)}
					thumbnailUrl={course.thumbnailUrl}
					lessonTitles={course.lessonTitles}
				/>
			))}
		</section>
	);
}
