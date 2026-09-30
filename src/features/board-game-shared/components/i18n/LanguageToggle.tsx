'use client';

import { useLocale } from './LocaleProvider';

export default function LanguageToggle({ className = '' }: { className?: string }) {
	const { locale, setLocale, t } = useLocale();
	const next = locale === 'vi' ? 'en' : 'vi';

	return (
		<button
			type="button"
			onClick={() => setLocale(next)}
			className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-border bg-surface px-2.5 font-mono text-xs font-bold tracking-wide text-foreground transition hover:bg-surface-hover focus-visible:outline-none ${className}`}
			aria-label={t('common.languageToggle')}
			title={t('common.languageToggle')}
		>
			{locale === 'vi' ? 'EN' : 'VI'}
		</button>
	);
}
