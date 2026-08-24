import Link from 'next/link';

import { listAdminRecallDecks } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function ActiveRecallAdminPage() {
	const decks = await listAdminRecallDecks();
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
				<div><p className="text-xs font-bold uppercase tracking-widest text-muted">Công cụ</p><h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Active Recall</h1><p className="mt-2 text-sm text-muted">Các bộ thẻ hỏi–đáp công khai và bản nháp.</p></div>
				<Link href={routes.admin.activeRecallNew} className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background">Tạo bộ thẻ</Link>
			</div>
			<div className="mt-6 overflow-hidden border border-border bg-surface">
				{decks.length ? decks.map((deck) => <Link key={deck.id} href={routes.admin.activeRecallEdit(deck.id)} className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-background"><div className="min-w-0 flex-1"><p className="font-bold text-foreground">{deck.title}</p><p className="mt-1 text-sm text-muted">{[deck.subject, deck.lessonLabel].filter(Boolean).join(' · ') || 'Chưa phân loại'} · cập nhật {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(deck.updatedAt))}</p></div><span className="text-sm tabular-nums text-muted">{deck.cardCount} thẻ</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${deck.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : deck.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{deck.status === 'PUBLISHED' ? 'Công khai' : deck.status === 'ARCHIVED' ? 'Lưu trữ' : 'Bản nháp'}</span></Link>) : <p className="p-8 text-sm text-muted">Chưa có bộ thẻ. Hãy tạo bộ đầu tiên.</p>}
			</div>
		</div>
	);
}
