'use client';

import Link from 'next/link';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useT } from '@/components/i18n/LocaleProvider';
import { Stamp } from '@/components/ui';
import { getGuideSections, getHonorRules } from '@/lib/spy/i18n';

export default function SpyGuidePage() {
	const t = useT();
	const sections = getGuideSections(t);
	const honorRules = getHonorRules(t);

	return (
		<main className="relative min-h-screen bg-background px-4 py-8 pb-16">
			<div className="mx-auto max-w-lg">
				<div className="mb-6 flex items-center justify-between">
					<nav className="flex gap-4 text-sm">
						<Link href="/games/spy" className="text-muted hover:text-foreground">
							← {t('common.back')}
						</Link>
						<Link href="/?tab=boardgames" className="text-muted hover:text-foreground">
							{t('spy.menu.backHub').replace(/^←\s*/, '')}
						</Link>
					</nav>
					<PrefsToggleGroup />
				</div>

				<Stamp label="Mission Briefing" variant="mission" className="mb-4" />
				<h1 className="font-display text-3xl font-bold text-ink">{t('spy.guide.title')}</h1>
				<p className="mt-2 text-sm text-muted-foreground">{t('spy.menu.guide')}</p>

				<div className="mt-8 space-y-6">
					{sections.map((s, i) => (
						<section key={s.title} className="animate-fade-in">
							<h2 className="font-display font-bold text-lg text-ink">
								{i + 1}. {s.title}
							</h2>
							<p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
						</section>
					))}
					<section className="border-t border-border pt-6">
						<h2 className="font-display font-bold text-lg text-ink mb-3">
							{t('spy.guide.honorTitle')}
						</h2>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
							{honorRules.map((r) => (
								<li key={r}>{r}</li>
							))}
						</ul>
					</section>
				</div>
			</div>
		</main>
	);
}
