import Link from 'next/link';

import { listCoursesWithStats } from '@/services/courseService';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
	const courses = await listCoursesWithStats();

	return (
		<main className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Khóa học của tôi</h1>
						<p className="mt-0.5 text-sm text-neutral-700">Chọn khóa học để bắt đầu hành trình học tập</p>
					</div>
					<Link 
						className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900:text-neutral-50" 
						href="/dashboard"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Dashboard
					</Link>
				</header>

				{courses.length === 0 ? (
					<div className="mt-8 rounded-xl border-2 border-dashed border-neutral-300 bg-white p-10 text-center">
						<svg className="mx-auto h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						<p className="mt-3 text-sm text-neutral-700">Chưa có khóa học nào. Liên hệ admin để được cấp quyền truy cập.</p>
					</div>
				) : (
					<div className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
						{courses.map((c) => (
							<Link
								key={c.id}
								href={`/courses/${encodeURIComponent(c.id)}`}
								className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md"
							>
								<h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600:text-primary-400">{c.name}</h3>
								{c.description ? (
									<p className="mt-1.5 line-clamp-2 text-sm text-neutral-700">{c.description}</p>
								) : null}
								
								<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
									<div className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-primary-700">
										<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
										<span className="font-medium">{c.lessonCount}</span>
										<span className="text-neutral-700">bài</span>
									</div>
									<div className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
										<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
										</svg>
										<span className="font-medium">{c.vocabularyCount}</span>
										<span className="text-neutral-700">từ</span>
									</div>
								</div>
								
								<div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 transition-opacity group-hover:opacity-100" />
							</Link>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
