import Link from 'next/link';

import { auth } from '@/lib/auth';
import { listCoursesWithStats } from '@/services/courseService';

export default async function DashboardPage() {
	const session = await auth();
	const user = session?.user;
	const courses = await listCoursesWithStats();
	const totalLessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
	const totalVocab = courses.reduce((sum, c) => sum + c.vocabularyCount, 0);

	return (
		<main className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<header>
					<h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
						Xin chào{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
					</h1>
					<p className="mt-0.5 text-sm text-neutral-700">Chào mừng bạn đến với nền tảng học tập</p>
				</header>

				{/* Quick Stats */}
				<section className="mt-6 grid gap-3 sm:grid-cols-3">
					<div className="rounded-xl border border-neutral-200 bg-white p-4">
						<div className="text-2xl font-bold text-primary-600">{courses.length}</div>
						<div className="mt-0.5 text-sm text-neutral-600">Khóa học</div>
					</div>
					<div className="rounded-xl border border-neutral-200 bg-white p-4">
						<div className="text-2xl font-bold text-primary-600">{totalLessons}</div>
						<div className="mt-0.5 text-sm text-neutral-600">Bài học</div>
					</div>
					<div className="rounded-xl border border-neutral-200 bg-white p-4">
						<div className="text-2xl font-bold text-primary-600">{totalVocab}</div>
						<div className="mt-0.5 text-sm text-neutral-600">Từ vựng</div>
					</div>
				</section>

				{/* Quick Actions */}
				<section className="mt-8">
					<h2 className="text-lg font-semibold text-neutral-900">Bắt đầu học</h2>
					<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<Link
							href="/courses"
							className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
								<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
							</div>
							<div className="flex-1">
								<div className="font-semibold text-neutral-900 group-hover:text-primary-600:text-primary-400">Khóa học của tôi</div>
								<div className="mt-0.5 text-xs text-neutral-700">Xem tất cả khóa học và bài học</div>
							</div>
						</Link>
						
						<Link
							href="/dashboard/vocabulary"
							className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
								<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
								</svg>
							</div>
							<div className="flex-1">
								<div className="font-semibold text-neutral-900 group-hover:text-primary-600:text-primary-400">Từ vựng</div>
								<div className="mt-0.5 text-xs text-neutral-700">Luyện tập từ vựng đã lưu</div>
							</div>
						</Link>
						
						<Link
							href="/blog"
							className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
								<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
								</svg>
							</div>
							<div className="flex-1">
								<div className="font-semibold text-neutral-900 group-hover:text-primary-600:text-primary-400">Blog</div>
								<div className="mt-0.5 text-xs text-neutral-700">Đọc bài viết và tài liệu</div>
							</div>
						</Link>
					</div>
				</section>

				{/* User Info */}
				{user ? (
					<section className="mt-8">
						<h2 className="text-lg font-semibold text-neutral-900">Thông tin tài khoản</h2>
						<div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
							<div className="flex items-center gap-3">
								{user.image ? (
									<img
										src={user.image}
										alt={user.name ?? 'Avatar'}
										className="h-12 w-12 rounded-full border-2 border-neutral-200"
										referrerPolicy="no-referrer"
									/>
								) : (
									<div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-neutral-200 bg-primary-50 text-lg font-bold text-primary-600">
										{(user.name ?? 'U')[0]}
									</div>
								)}
								<div>
									<div className="font-semibold text-neutral-900">{user.name ?? 'Người dùng'}</div>
									<div className="text-sm text-neutral-700">{user.email ?? '—'}</div>
									<div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
										{user.role === 'admin' ? (
											<>
												<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
												</svg>
												Admin
											</>
										) : (
											<>
												<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
													<path d="M12 14l9-5-9-5-9 5 9 5z" />
													<path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
													<path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
												</svg>
												Học viên
											</>
										)}
									</div>
								</div>
							</div>
						</div>
					</section>
				) : null}

				{/* Admin Link */}
				{user?.role === 'admin' ? (
					<section className="mt-6">
						<Link
							href="/admin"
							className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-all hover:border-amber-300 hover:shadow-md"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
								<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
							<div className="flex-1">
								<div className="font-semibold text-amber-900">Quản trị hệ thống</div>
								<div className="mt-0.5 text-xs text-amber-700">Truy cập Admin Portal để quản lý nội dung</div>
							</div>
							<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</Link>
					</section>
				) : null}
			</div>
		</main>
	);
}
