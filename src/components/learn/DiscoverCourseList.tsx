import Image from 'next/image';
import Link from 'next/link';

import SharedArtwork from '@/components/site/SharedArtwork';
import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { formatMinutes } from '@/features/learn/format';
import { LEARN_LEVEL_LABELS, type LearnLevel } from '@/features/learn/types';
import courseArt from '../../../public/brand/toc/courses-v1.webp';

import LearnCourseThumb from './LearnCourseThumb';

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

function courseBlurb(course: Pick<DiscoverCoursePreview, 'subtitle' | 'description'>) {
	return course.subtitle.trim() || course.description.trim();
}

export default function DiscoverCourseList({
	courses,
	signedIn,
}: {
	courses: DiscoverCoursePreview[];
	signedIn: boolean;
}) {
	return (
		<main className="min-h-svh bg-canvas px-6 pb-16 pt-28 text-ink sm:px-10 sm:pt-36">
			<div className="mx-auto max-w-4xl">
				<header className="flex items-end justify-between gap-6 border-b border-hairline pb-6">
					<div>
						<p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">
							Học theo nhịp của bạn
						</p>
						<h1 className="mt-3 max-w-3xl font-display text-title-1 leading-tight tracking-tight">
							Một điều mới bắt đầu từ đây.
						</h1>
						<p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-secondary">
							Xem chương trình trước, chọn điều bạn muốn học. Bạn chỉ cần đăng nhập khi bắt đầu.
						</p>
						{signedIn ? (
							<Link
								href="/my-space/courses"
								className="mt-4 inline-flex min-h-11 items-center text-subhead font-medium text-accent underline underline-offset-4"
							>
								Khóa học của tôi ↗
							</Link>
						) : null}
					</div>
					<SharedArtwork name="courses" className="hidden shrink-0 md:block">
						<Image src={courseArt} alt="" placeholder="blur" className="h-16 w-16 object-contain" />
					</SharedArtwork>
				</header>

				{courses.length ? (
					<section aria-label="Các khóa học" className="mt-6 flex flex-col gap-3">
						{courses.map((course) => (
							<DiscoverCourseCard key={course.slug} course={course} />
						))}
					</section>
				) : (
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
							Trở về mục lục ↗
						</Link>
					</section>
				)}
			</div>
		</main>
	);
}

function DiscoverCourseCard({ course }: { course: DiscoverCoursePreview }) {
	const blurb = courseBlurb(course);
	const facts = [
		LEARN_LEVEL_LABELS[course.level],
		course.category.trim(),
		`${course.lessonCount} bài`,
		course.totalMinutes > 0 ? `khoảng ${formatMinutes(course.totalMinutes)}` : '',
	].filter(Boolean);

	return (
		<article className="rounded-2xl border border-hairline bg-canvas">
			<Link
				href={routes.learnCourse(course.slug)}
				className="flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-5 sm:p-4"
			>
				<span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-paper sm:w-[200px]">
					<LearnCourseThumb slug={course.slug} thumbnailUrl={course.thumbnailUrl} />
				</span>
				<span className="min-w-0 flex-1 py-0.5">
					<h2 className="font-display text-title-3 leading-tight tracking-tight break-words">
						{course.title}
					</h2>
					{blurb ? (
						<span className="mt-1 line-clamp-2 block text-body leading-relaxed text-ink-secondary">
							{blurb}
						</span>
					) : null}
					<span className="mt-2 block text-subhead text-ink-secondary">{facts.join(' · ')}</span>
					<span className="mt-3 inline-flex items-center text-subhead font-medium text-ink">
						Vào khóa học
						<span aria-hidden="true" className="ml-2">
							↗
						</span>
					</span>
				</span>
			</Link>
			{course.lessonTitles.length ? (
				<div className="border-t border-hairline px-3 py-3 sm:px-4">
					<details className="text-subhead">
						<summary className="w-fit cursor-pointer rounded-md font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
							Xem chương trình
						</summary>
						<ol className="mt-3 space-y-1.5 pl-5 leading-relaxed text-ink-secondary">
							{course.lessonTitles.map((title, index) => (
								<li key={`${index}-${title}`} className="list-decimal break-words">
									{title}
								</li>
							))}
						</ol>
					</details>
				</div>
			) : null}
		</article>
	);
}
