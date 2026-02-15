import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getVocabSetById } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function VocabSetDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [session, set] = await Promise.all([auth(), getVocabSetById(id)]);
	if (!set) notFound();
	if (!session?.user) redirect('/login');

	const user = session.user;
	const isOwner = user.id === set.ownerId;
	const isAdmin = user.role === 'admin';

	// Only owner or admin can view
	if (!isOwner && !isAdmin) notFound();

	const practiceCards = [
		{
			href: `/vocabulary/${id}/flashcards`,
			title: 'Flashcards',
			desc: 'Lật thẻ để ghi nhớ từ vựng',
			color: 'text-accent',
			hoverBg: 'group-hover:bg-accent',
			icon: (
				<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/mcq`,
			title: 'Trắc nghiệm',
			desc: 'Chọn đáp án đúng',
			color: 'text-success',
			hoverBg: 'group-hover:bg-success',
			icon: (
				<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/fill-blank`,
			title: 'Điền từ',
			desc: 'Gõ từ vựng theo gợi ý nghĩa',
			color: 'text-indigo',
			hoverBg: 'group-hover:bg-indigo',
			icon: (
				<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/matching`,
			title: 'Nối từ',
			desc: 'Ghép từ với nghĩa tương ứng',
			color: 'text-purple',
			hoverBg: 'group-hover:bg-purple',
			icon: (
				<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
				</svg>
			),
		},
	];

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link href="/vocabulary" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground line-clamp-1">{set.title}</span>
					</div>
					<h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
						{set.title}
					</h1>
					{set.description ? (
						<p className="mt-2 max-w-lg text-sm text-foreground-secondary">{set.description}</p>
					) : null}
					<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
						<span>{set.termCount} từ</span>
						<span>·</span>
						<time>
							{new Date(set.updatedAt).toLocaleDateString('vi-VN', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
							})}
						</time>
					</div>

					{/* Actions */}
					<div className="mt-6 flex items-center gap-3">
						<Link
							href={`/vocabulary/${id}/edit`}
							className="inline-flex items-center gap-2 border-2 border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground"
						>
							Chỉnh sửa
						</Link>
					</div>
				</div>
			</section>

			{/* Practice modes */}
			{set.termCount >= 2 ? (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
						<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Luyện tập</h2>
						<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{practiceCards.map((card) => (
								<Link
									key={card.href}
									href={card.href}
									className="group flex items-center gap-4 border border-border p-5 transition-all hover:bg-surface-hover"
								>
									<div className={`flex h-12 w-12 shrink-0 items-center justify-center bg-surface-hover transition-colors ${card.hoverBg} group-hover:text-white ${card.color}`}>
										{card.icon}
									</div>
									<div>
										<div className={`text-sm font-bold uppercase tracking-wider ${card.color}`}>{card.title}</div>
										<div className="mt-0.5 text-xs text-muted">{card.desc}</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				</section>
			) : (
				<section className="border-b border-border">
					<div className="mx-auto max-w-6xl px-6 py-8">
						<p className="text-sm text-muted">Cần ít nhất 2 từ để luyện tập.</p>
					</div>
				</section>
			)}

			{/* Term list */}
			<section>
				<div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
					<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
						Danh sách từ ({set.termCount})
					</h2>
					<div className="mt-6 divide-y divide-border border border-border">
						{set.terms.map((term, idx) => (
							<div key={idx} className="flex items-start gap-4 p-4 sm:p-5">
								<span className="shrink-0 pt-0.5 text-xs font-bold text-muted">{idx + 1}</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
										<span className="text-sm font-bold text-foreground">{term.word}</span>
										{term.partOfSpeech ? (
											<span className="text-xs italic text-muted">({term.partOfSpeech})</span>
										) : null}
									</div>
									<p className="mt-1 text-sm text-foreground-secondary">{term.definition}</p>
									{term.example ? (
										<p className="mt-1 text-xs italic text-muted">{term.example}</p>
									) : null}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
