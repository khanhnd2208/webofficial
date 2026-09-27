'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

export default function PutPhoneDown() {
	const t = useT();
	return (
		<div className="flex w-full flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-5 py-6 text-center">
			<CheeseThiefArt scene="moon" size={64} />
			<p className="font-display text-2xl leading-tight font-medium tracking-tight text-foreground sm:text-3xl">
				{t('cheese.putDown')}
			</p>
			<p className="text-sm text-muted">{t('cheese.deal.waiting')}</p>
		</div>
	);
}
