'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button } from '@/components/ui';
import { mafiaMuted } from '@/components/mafia/mafiaStyles';

interface MafiaHeaderProps {
	title?: string;
	subtitle?: string;
	onBack?: () => void;
	backLabel?: string;
}

export default function MafiaHeader({ title, subtitle, onBack, backLabel }: MafiaHeaderProps) {
	const t = useT();

	return (
		<header className="animate-mafia-rise-in mb-6">
			{onBack ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onBack}
					className="mb-3 -ml-2 text-[var(--mafia-muted)] hover:bg-white/5 hover:text-[var(--mafia-foreground)]"
				>
					← {backLabel ?? t('mafia.header.back')}
				</Button>
			) : null}
			{title ? (
				<h1 className="font-display text-2xl font-bold tracking-tight text-[var(--mafia-foreground)] sm:text-3xl">
					{title}
				</h1>
			) : null}
			{subtitle ? <p className={`mt-2 text-sm ${mafiaMuted}`}>{subtitle}</p> : null}
		</header>
	);
}
