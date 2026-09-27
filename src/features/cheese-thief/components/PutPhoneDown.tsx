'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

export default function PutPhoneDown() {
	const t = useT();
	return (
		<p className="text-center font-display text-4xl leading-tight font-medium tracking-tight text-foreground sm:text-5xl">
			{t('cheese.putDown')}
		</p>
	);
}
