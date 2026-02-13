import Link from 'next/link';

import { getAllPosts, getAllTags } from '@/services/postService';

export const revalidate = 60;

export const metadata = {
	title: 'Blog | Website thầy giáo NDK',
	description: 'Bài viết chia sẻ kiến thức.',
};

function buildQuery(params: { tag?: string; page?: number }) {
	const sp = new URLSearchParams();
	if (params.tag) sp.set('tag', params.tag);
	if (params.page && params.page > 1) sp.set('page', String(params.page));
	const q = sp.toString();
	return q ? `?${q}` : '';
}

export default async function BlogPage({
	searchParams,
}: {
	searchParams?: Promise<{ tag?: string; page?: string }>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const tag = sp?.tag?.trim() || undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const limit = 9;

	const [result, tags] = await Promise.all([getAllPosts(page, limit, tag), getAllTags()]);

	return (
		<main className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Blog</h1>
						<p className="mt-0.5 text-sm text-neutral-700">Bài viết đã publish.</p>
					</div>
					<Link 
						className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900:text-neutral-50" 
						href="/"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Về trang chủ
					</Link>
				</header>

				<section className="mt-6">
					<div className="flex flex-wrap gap-2">
						<Link
							className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${!tag ? 'bg-primary-600 text-white shadow-sm' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100:bg-neutral-700'}`}
							href={`/blog${buildQuery({ page: 1 })}`}
						>
							Tất cả
						</Link>
						{tags.map((t) => (
							<Link
								key={t}
								className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${tag === t ? 'bg-primary-600 text-white shadow-sm' : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100:bg-neutral-700'}`}
								href={`/blog${buildQuery({ tag: t, page: 1 })}`}
							>
								{t}
							</Link>
						))}
					</div>
				</section>

				<section className="mt-6">
					{result.items.length === 0 ? (
						<div className="rounded-xl border-2 border-dashed border-neutral-300 bg-white p-10 text-center">
							<svg className="mx-auto h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
							</svg>
							<p className="mt-3 text-sm text-neutral-700">Không có bài viết nào.</p>
							<Link
								className="mt-4 inline-flex rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700:bg-primary-600"
								href="/admin/posts/create"
							>
								Tạo bài đầu tiên
							</Link>
						</div>
					) : (
						<div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
							{result.items.map((p) => (
								<article key={p.id} className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:shadow-md">
									<Link href={`/blog/${p.slug}`} className="block">
										{p.thumbnailUrl ? (
											<div className="aspect-video w-full overflow-hidden bg-neutral-100">
												<img
													src={p.thumbnailUrl}
													alt={p.title}
													className="h-full w-full object-cover transition-transform group-hover:scale-105"
													loading="lazy"
												/>
											</div>
										) : null}
										<div className="p-4">
											<h2 className="text-base font-semibold leading-snug text-neutral-900 group-hover:text-primary-600:text-primary-400">{p.title}</h2>
											<p className="mt-1.5 line-clamp-2 text-sm text-neutral-700">{p.summary}</p>
											{p.tags.length > 0 ? (
												<div className="mt-3 flex flex-wrap gap-1.5">
													{p.tags.slice(0, 2).map((tag) => (
														<span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
															{tag}
														</span>
													))}
												</div>
											) : null}
										</div>
									</Link>
								</article>
							))}
						</div>
					)}
				</section>

				<footer className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
					<Link
						className={`inline-flex items-center gap-1.5 text-sm font-medium ${result.page <= 1 ? 'pointer-events-none opacity-40' : 'text-neutral-700 hover:text-neutral-900:text-neutral-50'}`}
						href={`/blog${buildQuery({ tag, page: Math.max(1, result.page - 1) })}`}
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Trang trước
					</Link>
					<div className="text-sm text-neutral-700">
						Trang {result.page} / {result.totalPages}
					</div>
					<Link
						className={`inline-flex items-center gap-1.5 text-sm font-medium ${result.page >= result.totalPages ? 'pointer-events-none opacity-40' : 'text-neutral-700 hover:text-neutral-900:text-neutral-50'}`}
						href={`/blog${buildQuery({ tag, page: Math.min(result.totalPages, result.page + 1) })}`}
					>
						Trang sau
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</Link>
				</footer>
			</div>
		</main>
	);
}
