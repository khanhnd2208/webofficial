'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';

export default function PutPhoneDown() {
	const t = useT();
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<CheeseThiefArt scene="moon" size={44} />
			<p className="font-display text-4xl leading-tight font-medium tracking-tight text-foreground sm:text-5xl">
				{t('cheese.putDown')}
			</p>
		</div>
	);
}
