import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getVocabSetById } from '@/services/vocabSetService';

export const dynamic = 'force-dynamic';

export default async function VocabSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [session, set] = await Promise.all([auth(), getVocabSetById(id)]);
	if (!set) notFound();
	if (!session?.user) redirect(`/dang-nhap?from=${encodeURIComponent(`/vocabulary/${id}`)}`);

	const practiceCards = [
		{
			href: `/vocabulary/${id}/flashcards`,
			title: 'Flashcards',
			desc: 'Lật thẻ · ghi nhớ qua hình ảnh',
			badge: 'Bắt đầu',
			accent: 'from-accent/20 to-accent/5 border-accent/30 hover:border-accent',
			iconBg: 'bg-accent text-white',
			textColor: 'text-accent',
			icon: <Icon name="layers" className="h-6 w-6" />,
		},
		{
			href: `/vocabulary/${id}/mcq`,
			title: 'Trắc nghiệm',
			desc: 'Chọn đáp án đúng · 4 lựa chọn',
			badge: 'Luyện tập',
			accent: 'from-success/20 to-success/5 border-success/30 hover:border-success',
			iconBg: 'bg-success text-white',
			textColor: 'text-success',
			icon: <Icon name="check_circle" className="h-6 w-6" />,
		},
		{
			href: `/vocabulary/${id}/fill-blank`,
			title: 'Điền từ',
			desc: 'Gõ đúng từ · rèn phản xạ',
			badge: 'Thử thách',
			accent: 'from-indigo/20 to-indigo/5 border-indigo/30 hover:border-indigo',
			iconBg: 'bg-indigo text-white',
			textColor: 'text-indigo',
			icon: <Icon name="edit" className="h-6 w-6" />,
		},
		{
			href: `/vocabulary/${id}/matching`,
			title: 'Nối từ',
			desc: 'Ghép cặp từ · nghĩa tương ứng',
			badge: 'Tốc độ',
			accent: 'from-purple/20 to-purple/5 border-purple/30 hover:border-purple',
			iconBg: 'bg-purple text-white',
			textColor: 'text-purple',
			icon: <Icon name="shuffle" className="h-6 w-6" />,
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
						icon: <Icon name="help" className="h-6 w-6" />,
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
								<Icon name="play_arrow" className="h-3 w-3" filled />
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
									className={`group relative flex flex-col gap-4 border bg-gradient-to-br p-5 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lg ${card.accent}`}
								>
									{/* Badge top-right */}
									<span
										className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-widest ${card.iconBg}`}
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
										className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${card.textColor} transition-transform group-hover:translate-x-0.5`}
									>
										Vào học
										<Icon name="arrow_forward" className="h-3.5 w-3.5" />
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
