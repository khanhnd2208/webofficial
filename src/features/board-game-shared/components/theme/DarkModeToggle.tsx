'use client';

import { useTheme } from './ThemeProvider';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';

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
			<span aria-hidden>
				<GameIcon name={resolved === 'dark' ? 'sun' : 'moon'} size={17} />
			</span>
		</button>
	);
}
