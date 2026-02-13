import Link from 'next/link';

import AdminPostActions from './AdminPostActions';

import { getAdminPosts } from '@/services/postService';

export const dynamic = 'force-dynamic';

function buildQuery(params: { page?: number; published?: 'all' | 'true' | 'false' }) {
	const sp = new URLSearchParams();
	if (params.published && params.published !== 'all') sp.set('published', params.published);
	if (params.page && params.page > 1) sp.set('page', String(params.page));
	const q = sp.toString();
	return q ? `?${q}` : '';
}

export default async function AdminPostsPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string; published?: string }>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const published = (sp?.published ?? 'all') as 'all' | 'true' | 'false';
	const limit = 20;

	const result = await getAdminPosts(page, limit, published);

	return (
		<main className="mx-auto max-w-5xl bg-white px-6 py-10">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Admin • Posts</h1>
					<p className="mt-2 text-sm text-foreground/70">Danh sách bài viết (draft + published).</p>
				</div>
				<nav className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/">
						Trang chủ
					</Link>
					<Link className="text-sm underline underline-offset-4" href="/blog">
						Blog
					</Link>
					<Link
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
						href="/admin/posts/create"
					>
						+ Tạo bài
					</Link>
				</nav>
			</header>

			<section className="mt-6 flex flex-wrap gap-2">
				<Link
					className={`rounded-full border px-3 py-1 text-xs ${published === 'all' ? 'bg-foreground text-background' : 'border-foreground/15'}`}
					href={`/admin/posts${buildQuery({ page: 1, published: 'all' })}`}
				>
					Tất cả
				</Link>
				<Link
					className={`rounded-full border px-3 py-1 text-xs ${published === 'true' ? 'bg-foreground text-background' : 'border-foreground/15'}`}
					href={`/admin/posts${buildQuery({ page: 1, published: 'true' })}`}
				>
					Published
				</Link>
				<Link
					className={`rounded-full border px-3 py-1 text-xs ${published === 'false' ? 'bg-foreground text-background' : 'border-foreground/15'}`}
					href={`/admin/posts${buildQuery({ page: 1, published: 'false' })}`}
				>
					Draft
				</Link>
			</section>

			<section className="mt-6">
				{result.items.length === 0 ? (
					<p className="text-sm text-foreground/70">Chưa có bài viết nào.</p>
				) : (
					<div className="space-y-3">
						{result.items.map((p) => (
							<article key={p.id} className="rounded-lg border border-foreground/10 p-4">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="font-serif text-base font-semibold leading-snug">{p.title}</h2>
											<span
												className={`rounded-full border px-2 py-0.5 text-[11px] ${p.isPublished ? 'border-foreground/20' : 'border-foreground/10 text-foreground/60'}`}
											>
												{p.isPublished ? 'Published' : 'Draft'}
											</span>
										</div>
										<p className="mt-1 text-sm text-foreground/70">{p.summary}</p>
										<div className="mt-2 text-xs text-foreground/60">
											<span>Slug: {p.slug}</span>
											<span className="mx-2 text-foreground/30">•</span>
											<span>Cập nhật: {new Date(p.updatedAt).toLocaleString('vi-VN')}</span>
										</div>
									</div>
									<AdminPostActions id={p.id} slug={p.slug} title={p.title} isPublished={p.isPublished} />
								</div>
							</article>
						))}
					</div>
				)}
			</section>

			<footer className="mt-10 flex items-center justify-between">
				<Link
					className={`text-sm underline underline-offset-4 ${result.page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
					href={`/admin/posts${buildQuery({ published, page: Math.max(1, result.page - 1) })}`}
				>
					Trang trước
				</Link>
				<div className="text-sm text-foreground/70">
					Trang {result.page} / {result.totalPages}
				</div>
				<Link
					className={`text-sm underline underline-offset-4 ${result.page >= result.totalPages ? 'pointer-events-none opacity-40' : ''}`}
					href={`/admin/posts${buildQuery({ published, page: Math.min(result.totalPages, result.page + 1) })}`}
				>
					Trang sau
				</Link>
			</footer>
		</main>
	);
}
