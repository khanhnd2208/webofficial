'use client';

import { useTheme } from './ThemeProvider';
import { useT } from '@/components/i18n/LocaleProvider';

export default function DarkModeToggle({ className = '' }: { className?: string }) {
	const { resolved, setTheme } = useTheme();
	const t = useT();

	return (
		<button
			type="button"
			onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
			className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-hover focus-visible:outline-none ${className}`}
			aria-label={resolved === 'dark' ? t('common.darkLight') : t('common.darkDark')}
		>
			<span aria-hidden className="text-lg">
				{resolved === 'dark' ? '☀️' : '🌙'}
			</span>
		</button>
	);
}
