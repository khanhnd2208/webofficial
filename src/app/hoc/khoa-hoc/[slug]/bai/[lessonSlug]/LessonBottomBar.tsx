import Link from 'next/link';

import { routes } from '@/config/routes';
import CompleteLessonButton from './CompleteLessonButton';

type LessonBottomBarProps = {
	courseSlug: string;
	lessonId: string;
	completed: boolean;
	next: { slug: string; title: string } | null;
};

/**
 * Mobile lesson action bar — 56–64px, next lesson + complete.
 */
export default function LessonBottomBar({
	courseSlug,
	lessonId,
	completed,
	next,
}: LessonBottomBarProps) {
	return (
		<div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur-md lg:hidden">
			<div className="shell flex min-h-14 items-center gap-3 py-2.5 sm:min-h-16">
				{!completed ? (
					<div className="min-w-0 flex-1 [&_button]:w-full [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-xs">
						<CompleteLessonButton lessonId={lessonId} initiallyCompleted={completed} compact />
					</div>
				) : next ? (
					<Link
						href={routes.lesson(courseSlug, next.slug)}
						className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-ink px-4 text-xs font-semibold uppercase tracking-wider text-paper"
					>
						Bài tiếp theo
					</Link>
				) : (
					<Link
						href={routes.course(courseSlug)}
						className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-ink px-4 text-xs font-semibold uppercase tracking-wider text-paper"
					>
						Về khóa học
					</Link>
				)}
				{!completed && next ? (
					<Link
						href={routes.lesson(courseSlug, next.slug)}
						className="flex min-h-11 shrink-0 items-center rounded-lg border border-hairline px-4 text-xs font-semibold text-ink"
					>
						Tiếp →
					</Link>
				) : null}
			</div>
		</div>
	);
}
