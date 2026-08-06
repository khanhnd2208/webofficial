'use client';

import Link from 'next/link';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useT } from '@/components/i18n/LocaleProvider';
import { Card } from '@/components/ui';

export default function NightMarketGuideClient() {
	const t = useT();
	return <div className="min-h-screen bg-background px-4 py-8"><article className="mx-auto max-w-2xl">
		<div className="flex items-center justify-between"><Link href="/games/night-market" className="text-sm text-muted-foreground">← {t('nightMarket.title')}</Link><PrefsToggleGroup /></div>
		<header className="py-10 text-center"><div className="text-6xl">🏮</div><h1 className="font-display mt-4 text-4xl font-bold">{t('nightMarket.menu.guide')}</h1><p className="mt-3 text-muted-foreground">{t('nightMarket.guide.intro')}</p></header>
		<Card elevated><h2 className="font-display text-xl font-semibold">{t('nightMarket.guide.steps')}</h2><ol className="mt-5 space-y-4">{[1,2,3,4,5].map((step) => <li key={step} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-subtle font-mono font-bold text-purple">{step}</span><span className="pt-1 text-foreground-secondary">{t(`nightMarket.guide.step${step}`)}</span></li>)}</ol></Card>
		<Card className="mt-4 border-dashed"><p className="font-medium text-foreground-secondary">🏆 {t('nightMarket.guide.scoring')}</p></Card>
	</article></div>;
}
