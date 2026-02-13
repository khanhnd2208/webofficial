import Link from 'next/link';

import { getLatestPosts } from '@/services/postService';
import { listCoursesWithStats } from '@/services/courseService';

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  const latest = await getLatestPosts(3);
  const courses = await listCoursesWithStats();
  const totalLessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const totalVocab = courses.reduce((sum, c) => sum + c.vocabularyCount, 0);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl lg:text-5xl">
              Nền tảng học tập
              <span className="block mt-1 text-primary-600 dark:text-primary-400">hiện đại</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
              Khóa học chất lượng cao với nội dung được biên soạn kỹ lưỡng, 
              phương pháp giảng dạy hiệu quả và hệ thống luyện tập toàn diện.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/courses"
                className="w-full sm:w-auto rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Khám phá khóa học
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
              >
                Trang cá nhân
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-8 max-w-4xl sm:mt-10">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{courses.length}</div>
                <div className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">Khóa học</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalLessons}</div>
                <div className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">Bài học</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalVocab}</div>
                <div className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">Từ vựng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 ? (
        <section className="border-b border-neutral-200 bg-white py-10 dark:border-neutral-800 dark:bg-neutral-950 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">Khóa học nổi bật</h2>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">Bắt đầu hành trình học tập của bạn</p>
              </div>
              <Link
                href="/courses"
                className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 sm:block"
              >
                Xem tất cả
                <span aria-hidden="true"> →</span>
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${encodeURIComponent(course.id)}`}
                  className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-50 dark:group-hover:text-primary-400">
                      {course.name}
                    </h3>
                    {course.description ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">
                        {course.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {course.lessonCount} bài
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {course.vocabularyCount} từ
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/courses"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Xem tất cả khóa học
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Blog Posts */}
      {latest.length > 0 ? (
        <section className="bg-neutral-50 py-10 dark:bg-neutral-900 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">Bài viết mới nhất</h2>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">Kiến thức và tài liệu học tập</p>
              </div>
              <Link
                href="/blog"
                className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 sm:block"
              >
                Xem tất cả
                <span aria-hidden="true"> →</span>
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
              {latest.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {post.thumbnailUrl ? (
                    <div className="aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-50 dark:group-hover:text-primary-400">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">
                      {post.summary}
                    </p>
                    {post.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center lg:hidden">
              <Link
                href="/blog"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Xem tất cả bài viết
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
