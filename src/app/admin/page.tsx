import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
	return (
		<main className="grid gap-6 md:grid-cols-2">
			<section className="rounded-xl border border-border bg-surface p-6">
				<h2 className="text-lg font-semibold text-foreground">Blog Management</h2>
				<p className="mt-2 text-sm text-foreground-secondary">Quản lý bài viết: tạo, sửa, publish, xoá.</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<Link className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background" href="/admin/posts">
						Quản lý bài viết
					</Link>
					<Link className="rounded-md border border-border-hover px-4 py-2 text-sm text-foreground-secondary hover:text-foreground" href="/admin/posts/create">
						+ Tạo bài
					</Link>
					<Link className="rounded-md border border-border-hover px-4 py-2 text-sm text-foreground-secondary hover:text-foreground" href="/blog">
						Xem Blog (Public)
					</Link>
				</div>
			</section>

			<section className="rounded-xl border border-border bg-surface p-6">
				<h2 className="text-lg font-semibold text-foreground">Learning Management</h2>
				<p className="mt-2 text-sm text-foreground-secondary">Quản lý theo cây: Course → Unit → Lesson → Vocabulary.</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<Link className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background" href="/admin/learning">
						Course Tree Manager
					</Link>
				</div>
				<p className="mt-3 text-xs text-muted">
					Student flow: mở lesson ở <span className="font-mono">/courses/lessons/&lt;id&gt;</span>.
				</p>
			</section>
		</main>
	);
}
