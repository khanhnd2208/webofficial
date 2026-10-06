import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';

import AdminPostActions from './AdminPostActions';
import PostFilters from './PostFilters';

import {
	getAdminDashboardStats,
	getAdminPosts,
	getAllCategoriesAdmin,
	getAllTagsAdmin,
} from '@/services/postService';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage({
	searchParams,
}: {
	searchParams?: Promise<{
		page?: string;
		published?: string;
		tag?: string;
		category?: string;
		search?: string;
		sort?: string;
		dateFrom?: string;
		dateTo?: string;
	}>;
}) {
	const sp = searchParams ? await searchParams : undefined;
	const page = Math.max(1, Number(sp?.page ?? '1') || 1);
	const published = (sp?.published ?? 'all') as 'all' | 'true' | 'false';
	const tag = sp?.tag || undefined;
	const category = sp?.category || undefined;
	const search = sp?.search || undefined;
	const sort = sp?.sort || undefined;
	const dateFrom = sp?.dateFrom || undefined;
	const dateTo = sp?.dateTo || undefined;
	const limit = 20;

	const [result, stats, allTags, allCategories] = await Promise.all([
		getAdminPosts(page, limit, published, { tag, category, search, sort, dateFrom, dateTo }),
		getAdminDashboardStats(),
		getAllTagsAdmin(),
		getAllCategoriesAdmin(),
	]);

	const hasActiveFilters = !!(
		tag ||
		(category && category !== 'all') ||
		search ||
		dateFrom ||
		dateTo
	);

	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Nội dung"
				title="Bài viết"
				description="Tạo, sửa, xuất bản và theo dõi bài viết."
				actions={
					<div className="flex items-center gap-3">
						<Link
							className="inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 hover:text-foreground"
							href="/bai-viet"
							target="_blank"
						>
							Xem ghi chép ↗
						</Link>
						<Link
							className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
							href="/admin/posts/create"
						>
							Viết bài mới
						</Link>
					</div>
				}
			/>

			{/* Dashboard Stats */}
			<section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				<div className="rounded-xl border border-border bg-surface p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted">Tổng bài</p>
					<p className="mt-1 text-2xl font-bold">{stats.totalPosts}</p>
				</div>
				<div className="rounded-xl border border-border bg-surface p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-success">Đã xuất bản</p>
					<p className="mt-1 text-2xl font-bold text-success">{stats.published}</p>
				</div>
				<div className="rounded-xl border border-border bg-surface p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-warning">Bản nháp</p>
					<p className="mt-1 text-2xl font-bold text-warning">{stats.drafts}</p>
				</div>
				<div className="rounded-xl border border-border bg-surface p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted">Lượt xem</p>
					<p className="mt-1 text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
				</div>
				<div className="rounded-xl border border-border bg-surface p-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted">Reactions</p>
					<p className="mt-1 text-2xl font-bold">{stats.totalReactions.toLocaleString()}</p>
				</div>
			</section>

			{/* Filters */}
			<PostFilters
				currentPublished={published}
				currentTag={tag}
				currentCategory={category}
				currentSearch={search}
				currentSort={sort}
				currentDateFrom={dateFrom}
				currentDateTo={dateTo}
				allTags={allTags}
				allCategories={allCategories}
			/>

			{/* Active filters indicator */}
			{hasActiveFilters ? (
				<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
					<span>Đang lọc:</span>
					{search && (
						<span className="rounded-full bg-accent-subtle px-2 py-0.5 text-accent">
							Tìm: &quot;{search}&quot;
						</span>
					)}
					{tag && <span className="rounded-full bg-surface-secondary px-2 py-0.5">Tag: {tag}</span>}
					{category && category !== 'all' && (
						<span className="rounded-full bg-surface-secondary px-2 py-0.5">
							Chủ đề: {category}
						</span>
					)}
					{dateFrom && (
						<span className="rounded-full bg-surface-secondary px-2 py-0.5">Từ: {dateFrom}</span>
					)}
					{dateTo && (
						<span className="rounded-full bg-surface-secondary px-2 py-0.5">Đến: {dateTo}</span>
					)}
					<Link
						href="/admin/posts"
						className="ml-1 font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
					>
						Xoá bộ lọc
					</Link>
				</div>
			) : null}

			{/* Results count */}
			<div className="mt-4 text-xs text-muted">
				Hiển thị {result.items.length} / {result.total} bài viết
			</div>

			{/* Post List Table */}
			<section className="mt-4">
				{result.items.length === 0 ? (
					<AdminEmptyState
						title="Không tìm thấy bài viết"
						description={
							hasActiveFilters
								? 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.'
								: 'Bắt đầu viết bài đầu tiên.'
						}
						action={
							hasActiveFilters
								? { href: '/admin/posts', label: 'Xoá bộ lọc' }
								: { href: '/admin/posts/create', label: 'Tạo bài viết' }
						}
					/>
				) : (
					<div className="overflow-hidden rounded-xl border border-border">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-surface-secondary/50">
									<th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
										Bài viết
									</th>
									<th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">
										Chủ đề
									</th>
									<th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">
										Thống kê
									</th>
									<th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">
										Ngày
									</th>
									<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
										Thao tác
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{result.items.map((p) => {
									const readingTime = Math.max(1, Math.round((p.wordCount || 0) / 200));
									const totalReactions =
										(p.reactions?.like || 0) +
										(p.reactions?.love || 0) +
										(p.reactions?.fire || 0) +
										(p.reactions?.clap || 0);
									return (
										<tr key={p.id} className="transition-colors hover:bg-surface-hover/30">
											{/* Title + tags + status */}
											<td className="max-w-xs px-4 py-3">
												<div className="flex items-start gap-2">
													<Link href={`/admin/posts/${p.id}/edit`} className="group min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className="truncate font-medium text-foreground group-hover:text-accent">
																{p.title}
															</span>
															{p.isPinned ? (
																<span className="inline-flex shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-bold text-accent">
																	📌
																</span>
															) : null}
															<span
																className={`inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold uppercase ${
																	p.isPublished
																		? 'bg-success-subtle text-success'
																		: 'bg-warning-subtle text-warning'
																}`}
															>
																{p.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
															</span>
														</div>
														<p className="mt-0.5 line-clamp-1 text-xs text-muted">{p.summary}</p>
													</Link>
												</div>
												{p.tags.length > 0 && (
													<div className="mt-1.5 flex flex-wrap gap-1">
														{p.tags.slice(0, 4).map((t) => (
															<span
																key={t}
																className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
															>
																{t}
															</span>
														))}
														{p.tags.length > 4 && (
															<span className="text-xs text-muted">+{p.tags.length - 4}</span>
														)}
													</div>
												)}
											</td>

											{/* Category */}
											<td className="hidden px-4 py-3 md:table-cell">
												<span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-secondary">
													{p.category}
												</span>
											</td>

											{/* Stats */}
											<td className="hidden px-4 py-3 lg:table-cell">
												<div className="flex items-center gap-3 text-xs text-muted">
													<span title="Lượt xem" className="inline-flex items-center gap-0.5">
														<Icon name="visibility" className="h-3 w-3" />{' '}
														{(p.views || 0).toLocaleString()}
													</span>
													{totalReactions > 0 && (
														<span title="Reactions" className="inline-flex items-center gap-0.5">
															<Icon name="favorite" className="h-3 w-3" /> {totalReactions}
														</span>
													)}
													<span title="Thời gian đọc" className="inline-flex items-center gap-0.5">
														<Icon name="schedule" className="h-3 w-3" /> {readingTime}p
													</span>
												</div>
											</td>

											{/* Date */}
											<td className="hidden px-4 py-3 sm:table-cell">
												<div className="text-xs text-muted">
													<div>{new Date(p.updatedAt).toLocaleDateString('vi-VN')}</div>
													{p.publishedAt && (
														<div className="text-xs text-success">
															Xuất bản: {new Date(p.publishedAt).toLocaleDateString('vi-VN')}
														</div>
													)}
												</div>
											</td>

											{/* Actions */}
											<td className="px-4 py-3">
												<div className="flex justify-end">
													<AdminPostActions
														id={p.id}
														slug={p.slug}
														title={p.title}
														isPublished={p.isPublished}
													/>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Pagination */}
			{result.totalPages > 1 && (
				<footer className="mt-6 flex items-center justify-between">
					<PaginationLink
						label="← Trước"
						disabled={result.page <= 1}
						href={buildAdminUrl({
							published,
							tag,
							category,
							search,
							sort,
							dateFrom,
							dateTo,
							page: result.page - 1,
						})}
					/>
					<div className="text-xs text-muted">
						Trang {result.page} / {result.totalPages}
					</div>
					<PaginationLink
						label="Sau →"
						disabled={result.page >= result.totalPages}
						href={buildAdminUrl({
							published,
							tag,
							category,
							search,
							sort,
							dateFrom,
							dateTo,
							page: result.page + 1,
						})}
					/>
				</footer>
			)}
		</div>
	);
}

function PaginationLink({
	label,
	disabled,
	href,
}: {
	label: string;
	disabled: boolean;
	href: string;
}) {
	return (
		<Link
			className={`inline-flex min-h-11 items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors ${
				disabled ? 'pointer-events-none opacity-30' : 'hover:bg-surface-hover'
			}`}
			href={href}
		>
			{label}
		</Link>
	);
}

function buildAdminUrl(params: {
	published?: string;
	tag?: string;
	category?: string;
	search?: string;
	sort?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
}) {
	const sp = new URLSearchParams();
	if (params.published && params.published !== 'all') sp.set('published', params.published);
	if (params.tag) sp.set('tag', params.tag);
	if (params.category && params.category !== 'all') sp.set('category', params.category);
	if (params.search) sp.set('search', params.search);
	if (params.sort && params.sort !== 'updated') sp.set('sort', params.sort);
	if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
	if (params.dateTo) sp.set('dateTo', params.dateTo);
	if (params.page && params.page > 1) sp.set('page', String(params.page));
	const q = sp.toString();
	return `/admin/posts${q ? `?${q}` : ''}`;
}
