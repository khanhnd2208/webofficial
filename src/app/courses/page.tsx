import Link from 'next/link';

import { listCoursesWithStats } from '@/services/courseService';
import { IconBook, IconVocabulary } from '@/components/icons';

export const revalidate = 60;

export default async function CoursesPage() {
	const courses = await listCoursesWithStats();

	return (
		<main className="min-h-screen bg-background-secondary">
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Khóa học của tôi</h1>
						<p className="mt-0.5 text-sm text-foreground-secondary">Chọn khóa học để bắt đầu hành trình học tập</p>
					</div>
					<Link 
						className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground" 
						href="/dashboard"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Dashboard
					</Link>
				</header>

				{courses.length === 0 ? (
					<div className="mt-8 rounded-xl border-2 border-dashed border-border-strong bg-surface p-10 text-center">
						<IconBook className="mx-auto h-10 w-10 text-muted" />
						<p className="mt-3 text-sm text-foreground-secondary">Chưa có khóa học nào. Liên hệ admin để được cấp quyền truy cập.</p>
					</div>
				) : (
					<div className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
						{courses.map((c) => (
							<Link
								key={c.id}
								href={`/courses/${encodeURIComponent(c.id)}`}
								className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md"
							>
								<h3 className="text-base font-semibold text-foreground group-hover:text-accent">{c.name}</h3>
								{c.description ? (
									<p className="mt-1.5 line-clamp-2 text-sm text-foreground-secondary">{c.description}</p>
								) : null}
								
								<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
									<div className="flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-1 text-accent">
										<IconBook className="h-3 w-3" />
										<span className="font-medium">{c.lessonCount}</span>
										<span className="text-muted">bài</span>
									</div>
									<div className="flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-foreground-secondary">
										<IconVocabulary className="h-3 w-3" />
										<span className="font-medium">{c.vocabularyCount}</span>
										<span className="text-muted">từ</span>
									</div>
								</div>
								
								<div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-accent to-accent-hover opacity-0 transition-opacity group-hover:opacity-100" />
							</Link>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
