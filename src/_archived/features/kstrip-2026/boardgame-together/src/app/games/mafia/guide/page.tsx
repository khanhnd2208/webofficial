'use client';

import Link from 'next/link';

import LanguageToggle from '@/components/i18n/LanguageToggle';
import { useT } from '@/components/i18n/LocaleProvider';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { cn } from '@/lib/cn';

export default function MafiaGuidePage() {
	const t = useT();

	return (
		<MafiaScreen>
			<div className="absolute right-4 top-4 z-10">
				<LanguageToggle className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)] hover:bg-white/5" />
			</div>
			<h1 className="font-display animate-mafia-rise-in text-2xl font-bold text-[var(--mafia-gold)]">
				{t('mafia.guide.title')}
			</h1>
			<div className={cn('mt-6 space-y-4 p-4 text-sm text-[var(--mafia-muted)]', mafiaGlass)}>
				<p>{t('mafia.guide.intro')}</p>
				<ol className="list-inside list-decimal space-y-2 text-[var(--mafia-foreground)]">
					<li>{t('mafia.guide.step1')}</li>
					<li>{t('mafia.guide.step2')}</li>
					<li>{t('mafia.guide.step3')}</li>
					<li>{t('mafia.guide.step4')}</li>
					<li>{t('mafia.guide.step5')}</li>
				</ol>
				<p>{t('mafia.guide.outro')}</p>
			</div>
			<Link
				href="/games/mafia"
				className={cn(
					'mt-6 flex w-full items-center justify-center rounded-xl px-5 py-3 text-base font-semibold',
					mafiaPrimary,
				)}
			>
				{t('mafia.guide.start')}
			</Link>
			<p className="mt-4 text-center text-sm">
				<Link href="/games/mafia" className="text-[var(--mafia-muted)] hover:text-[var(--mafia-foreground)]">
					{t('mafia.guide.back')}
				</Link>
			</p>
		</MafiaScreen>
	);
}
