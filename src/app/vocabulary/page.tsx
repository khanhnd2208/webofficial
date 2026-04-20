import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getUserLibrary } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function VocabularyPage() {
	const session = await auth();
	if (!session?.user) redirect('/login');

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
								{sets.length} bộ · Tạo bộ từ vựng và luyện tập với Flashcard, MCQ, Điền từ và Nối từ.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Link
								href="/vocabulary/store"
								className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-rose hover:text-rose"
							>
								<svg className="h-4 w-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0h18" />
								</svg>
								Cửa hàng
							</Link>
							<Link
								href="/vocabulary/database"
								className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground"
							>
								<svg className="h-4 w-4 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
								</svg>
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
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0h18" />
							</svg>
						</div>
						<div>
							<div className="text-sm font-bold uppercase tracking-wider text-foreground">Cửa hàng từ vựng</div>
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
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
							</svg>
						</div>
						<div>
							<div className="text-sm font-bold uppercase tracking-wider text-foreground">Kho từ vựng</div>
							<div className="mt-0.5 text-xs text-muted">Tra cứu tất cả từ đã thêm</div>
						</div>
						<span className="ml-auto text-xs font-bold text-muted">→</span>
					</Link>
					{sets.length === 0 ? (
						<div className="border-2 border-dashed border-border p-16 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
								<svg className="h-7 w-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
								</svg>
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
										<p className="mt-2 line-clamp-2 text-xs text-foreground-secondary">{set.description}</p>
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
