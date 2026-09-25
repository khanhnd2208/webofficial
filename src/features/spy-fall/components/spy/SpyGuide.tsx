'use client';

import Link from 'next/link';
import Image from 'next/image';

import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Stamp } from '@/features/spy-fall/components/ui';
import GameIcon, { type GameIconName } from '@/features/spy-fall/components/ui/GameIcon';
import { getGuideSections, getHonorRules } from '@/features/spy-fall/lib/spy/i18n';
import { routes } from '@/config/routes';

export default function SpyGuidePage() {
	const t = useT();
	const sections = getGuideSections(t);
	const honorRules = getHonorRules(t);
	const sectionIcons: GameIconName[] = ['eye', 'users', 'target', 'shield', 'passport', 'compass'];

	return (
		<main className="game-theme game-theme-spy px-4 py-5 pb-16 sm:px-6 sm:py-8">
			<div className="mx-auto max-w-3xl">
				<div className="mb-6 flex items-center justify-between">
					<nav className="flex items-center gap-4 text-xs uppercase tracking-[0.14em]">
						<Link href={routes.spyFall} className="text-muted hover:text-foreground">
							<GameIcon name="arrow-left" size={15} className="mr-1 inline" /> {t('common.back')}
						</Link>
						<Link href={routes.boardGame} className="text-muted hover:text-foreground">
							Board Game
						</Link>
					</nav>
					<PrefsToggleGroup />
				</div>

				<section className="game-theme-hero rounded-[1.25rem]">
					<Image
						src="/brand/myspace/spy-fall-editorial.png"
						alt={t('spy.menu.guideAlt')}
						fill
						className="game-theme-hero-image"
						sizes="(max-width: 768px) 100vw, 768px"
					/>
					<div className="relative z-10 flex min-h-[14rem] flex-col justify-end p-6 sm:min-h-[17rem] sm:p-9">
						<div className="game-theme-mark mb-5">
							<GameIcon name="book" size={26} />
						</div>
						<Stamp label="Mission Briefing" variant="mission" className="mb-3 w-fit" />
						<h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
							{t('spy.guide.title')}
						</h1>
						<p className="mt-2 text-sm text-foreground-secondary">{t('spy.menu.guide')}</p>
					</div>
				</section>

				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					{sections.map((s, i) => (
						<section key={s.title} className="game-theme-panel animate-fade-in rounded-2xl p-5">
							<div className="flex items-start gap-3">
								<div className="game-theme-mark h-10 w-10 rounded-lg shadow-none">
									<GameIcon name={sectionIcons[i] ?? 'compass'} size={19} />
								</div>
								<div>
									<p className="game-theme-kicker">0{i + 1}</p>
									<h2 className="mt-1 font-display text-lg font-bold text-ink">{s.title}</h2>
								</div>
							</div>
							<p className="mt-4 leading-relaxed text-muted-foreground">{s.body}</p>
						</section>
					))}
					<section className="game-theme-panel rounded-2xl p-5 sm:col-span-2">
						<div className="flex items-center gap-3">
							<div className="game-theme-mark h-10 w-10 rounded-lg shadow-none">
								<GameIcon name="shield" size={19} />
							</div>
							<h2 className="font-display text-lg font-bold text-ink">
								{t('spy.guide.honorTitle')}
							</h2>
						</div>
						<ul className="mt-4 grid gap-2 text-muted-foreground sm:grid-cols-2">
							{honorRules.map((r) => (
								<li
									key={r}
									className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface/40 px-3 py-2 text-sm"
								>
									<GameIcon name="check" size={15} className="mt-0.5 text-accent" />
									{r}
								</li>
							))}
						</ul>
					</section>
				</div>
			</div>
		</main>
	);
}
