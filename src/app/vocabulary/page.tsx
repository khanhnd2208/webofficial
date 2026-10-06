import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getUserLibrary } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function VocabularyPage() {
	const session = await auth();
	if (!session?.user) redirect(`/dang-nhap?from=${encodeURIComponent('/vocabulary')}`);

	const user = session.user;
	const sets = await getUserLibrary(user.id);

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
					<div className="flex items-end justify-between">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-muted">Vocabulary</p>
							<h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
								Bộ từ vựng của tôi
							</h1>
							<p className="mt-2 text-sm text-foreground-secondary">
								{sets.length} bộ · Luyện tập với Flashcard, MCQ, Điền từ và Nối từ.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Link
								href="/vocabulary/store"
								className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-rose hover:text-rose"
							>
								<Icon name="layers" className="h-4 w-4 text-rose" />
								Cửa hàng
							</Link>
							<Link
								href="/vocabulary/database"
								className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground"
							>
								<Icon name="globe" className="h-4 w-4 text-indigo" />
								Kho từ
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Sets */}
			<section>
				<div className="mx-auto max-w-6xl px-6 py-12">
					{/* Mobile store link */}
					<Link
						href="/vocabulary/store"
						className="mb-4 flex items-center gap-3 border border-border p-4 transition-colors hover:bg-surface-hover sm:hidden"
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center bg-rose-subtle text-rose">
							<Icon name="mail" className="h-5 w-5" />
						</div>
						<div>
							<div className="text-sm font-bold uppercase tracking-wider text-foreground">
								Cửa hàng từ vựng
							</div>
							<div className="mt-0.5 text-xs text-muted">Tải bộ từ do Admin tuyển chọn</div>
						</div>
						<span className="ml-auto text-xs font-bold text-muted">→</span>
					</Link>

					{/* Mobile database link */}
					<Link
						href="/vocabulary/database"
						className="mb-6 flex items-center gap-3 border border-border p-4 transition-colors hover:bg-surface-hover sm:hidden"
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center bg-indigo-subtle text-indigo">
							<Icon name="shield" className="h-5 w-5" />
						</div>
						<div>
							<div className="text-sm font-bold uppercase tracking-wider text-foreground">
								Kho từ vựng
							</div>
							<div className="mt-0.5 text-xs text-muted">Tra cứu tất cả từ đã thêm</div>
						</div>
						<span className="ml-auto text-xs font-bold text-muted">→</span>
					</Link>
					{sets.length === 0 ? (
						<div className="border-2 border-dashed border-border p-16 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
								<Icon name="menu_book" className="h-7 w-7 text-muted" />
							</div>
							<p className="mt-5 text-sm font-medium text-foreground">Bạn chưa có bộ từ vựng nào</p>
							<p className="mt-1 text-xs text-muted">
								Đến cửa hàng và tải về bộ từ vựng do admin tuyển chọn.
							</p>
							<div className="mt-6 flex items-center justify-center gap-3">
								<Link
									href="/vocabulary/store"
									className="inline-flex items-center gap-2 rounded-full border-2 border-rose bg-rose px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-rose"
								>
									Đến cửa hàng từ vựng
								</Link>
							</div>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{sets.map((set) => (
								<Link
									key={set.id}
									href={`/vocabulary/${set.id}`}
									className="group relative border border-border p-5 transition-all hover:bg-surface-hover"
								>
									<div className="flex items-start justify-between gap-3">
										<h3 className="text-sm font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-accent">
											{set.title}
										</h3>
										<span className="shrink-0 rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-bold text-muted group-hover:bg-background">
											{set.wordCount} từ
										</span>
									</div>
									{set.description ? (
										<p className="mt-2 line-clamp-2 text-xs text-foreground-secondary">
											{set.description}
										</p>
									) : null}
									<time className="mt-4 block text-xs text-muted">
										{new Date(set.updatedAt).toLocaleDateString('vi-VN', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
										})}
									</time>
								</Link>
							))}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
