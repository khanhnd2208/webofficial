import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getVocabSetById } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function VocabSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [session, set] = await Promise.all([auth(), getVocabSetById(id)]);
	if (!set) notFound();
	if (!session?.user) redirect('/dang-nhap');

	const practiceCards = [
		{
			href: `/vocabulary/${id}/flashcards`,
			title: 'Flashcards',
			desc: 'Lật thẻ · ghi nhớ qua hình ảnh',
			badge: 'Bắt đầu',
			accent: 'from-accent/20 to-accent/5 border-accent/30 hover:border-accent',
			iconBg: 'bg-accent text-white',
			textColor: 'text-accent',
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
					/>
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/mcq`,
			title: 'Trắc nghiệm',
			desc: 'Chọn đáp án đúng · 4 lựa chọn',
			badge: 'Luyện tập',
			accent: 'from-success/20 to-success/5 border-success/30 hover:border-success',
			iconBg: 'bg-success text-white',
			textColor: 'text-success',
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/fill-blank`,
			title: 'Điền từ',
			desc: 'Gõ đúng từ · rèn phản xạ',
			badge: 'Thử thách',
			accent: 'from-indigo/20 to-indigo/5 border-indigo/30 hover:border-indigo',
			iconBg: 'bg-indigo text-white',
			textColor: 'text-indigo',
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
					/>
				</svg>
			),
		},
		{
			href: `/vocabulary/${id}/matching`,
			title: 'Nối từ',
			desc: 'Ghép cặp từ · nghĩa tương ứng',
			badge: 'Tốc độ',
			accent: 'from-purple/20 to-purple/5 border-purple/30 hover:border-purple',
			iconBg: 'bg-purple text-white',
			textColor: 'text-purple',
			icon: (
				<svg
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
					/>
				</svg>
			),
		},
		...(set.words.some((w) => w.hintsHard.length + w.hintsMedium.length + w.hintsEasy.length > 0)
			? [
					{
						href: `/vocabulary/${id}/guess-who`,
						title: 'Guess Who I Am',
						desc: 'Đoán từ qua gợi ý · tính điểm thời gian',
						badge: '🎮 Mới',
						accent:
							'from-violet-500/20 to-violet-500/5 border-violet-500/30 hover:border-violet-500',
						iconBg: 'bg-violet-600 text-white',
						textColor: 'text-violet-600 dark:text-violet-400',
						icon: (
							<svg
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
								/>
							</svg>
						),
					},
				]
			: []),
	];

	return (
		<main className="min-h-screen">
			{/* Header */}
			<section className="border-b border-border">
				<div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
					<div className="flex items-center gap-3">
						<Link
							href="/vocabulary"
							className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
						>
							Từ vựng
						</Link>
						<span className="text-xs text-muted">/</span>
						<span className="text-xs font-bold uppercase tracking-widest text-foreground line-clamp-1">
							{set.title}
						</span>
					</div>
					<h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl lg:text-4xl">
						{set.title}
					</h1>
					{set.description ? (
						<p className="mt-2 max-w-lg text-sm text-foreground-secondary">{set.description}</p>
					) : null}
					<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
						<span>{set.wordCount} từ</span>
						<span>·</span>
						<time>
							{new Date(set.updatedAt).toLocaleDateString('vi-VN', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
							})}
						</time>
					</div>
				</div>
			</section>

			{/* Practice modes */}
			{set.wordCount >= 2 ? (
				<section className="border-b border-border bg-gradient-to-b from-surface to-transparent">
					<div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
						<div className="flex items-center gap-3 mb-2">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
								<svg
									className="h-3 w-3"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
									/>
								</svg>
							</span>
							<h2 className="text-sm font-black uppercase tracking-widest text-foreground">
								Bắt đầu luyện tập
							</h2>
						</div>
						<p className="mb-8 text-xs text-muted pl-8">
							Chọn chế độ phù hợp · mỗi chế độ ghi nhớ theo cách khác nhau
						</p>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{practiceCards.map((card) => (
								<Link
									key={card.href}
									href={card.href}
									className={`group relative flex flex-col gap-4 border bg-gradient-to-br p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${card.accent}`}
								>
									{/* Badge top-right */}
									<span
										className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${card.iconBg}`}
									>
										{card.badge}
									</span>

									{/* Icon */}
									<div
										className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} shadow-sm`}
									>
										{card.icon}
									</div>

									{/* Content */}
									<div>
										<div
											className={`text-base font-black uppercase tracking-wider ${card.textColor}`}
										>
											{card.title}
										</div>
										<div className="mt-1 text-xs text-muted">{card.desc}</div>
									</div>

									{/* Arrow */}
									<div
										className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest ${card.textColor} transition-transform group-hover:translate-x-0.5`}
									>
										Vào học
										<svg
											className="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2.5}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
											/>
										</svg>
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
						Danh sách từ ({set.wordCount})
					</h2>
					<div className="mt-6 divide-y divide-border border border-border">
						{set.words.map((word, idx) => (
							<div key={word.id} className="flex items-start gap-4 p-4 sm:p-5">
								<span className="shrink-0 pt-0.5 text-xs font-bold text-muted">{idx + 1}</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
										<span className="text-sm font-bold text-foreground">{word.term}</span>
										{word.partOfSpeech ? (
											<span className="text-xs italic text-muted">({word.partOfSpeech})</span>
										) : null}
									</div>
									<p className="mt-1 text-sm text-foreground-secondary">{word.definition}</p>
									{word.example ? (
										<p className="mt-1 text-xs italic text-muted">{word.example}</p>
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
