import Link from 'next/link';

import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { listAdminRecallDecks } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function ActiveRecallAdminPage() {
	const decks = await listAdminRecallDecks();
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Active Recall"
				title="Active Recall"
				description="Các bộ thẻ hỏi–đáp công khai và bản nháp."
				actions={
					<Link href={routes.admin.activeRecallNew} className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-bold text-background">
						Tạo bộ thẻ
					</Link>
				}
			/>
			<div className="mt-6 overflow-hidden border border-border bg-surface">
				{decks.length ? decks.map((deck) => <Link key={deck.id} href={routes.admin.activeRecallEdit(deck.id)} className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-background"><div className="min-w-0 flex-1"><p className="font-bold text-foreground">{deck.title}</p><p className="mt-1 text-sm text-muted">{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ') || 'Chưa phân loại'} · cập nhật {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(deck.updatedAt))}</p></div><span className="text-sm tabular-nums text-muted">{deck.cardCount} thẻ</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${deck.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : deck.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{deck.status === 'PUBLISHED' ? 'Công khai' : deck.status === 'ARCHIVED' ? 'Lưu trữ' : 'Bản nháp'}</span></Link>) : (
					<div className="p-6">
						<AdminEmptyState
							title="Chưa có bộ thẻ"
							description="Tạo bộ Active Recall đầu tiên để xuất bản hỏi–đáp công khai."
							action={{ href: routes.admin.activeRecallNew, label: 'Tạo bộ thẻ' }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
