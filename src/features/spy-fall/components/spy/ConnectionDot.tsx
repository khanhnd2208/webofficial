'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { cn } from '@/features/spy-fall/lib/cn';

interface Props {
	connected: boolean;
	className?: string;
}

export default function ConnectionDot({ connected, className = '' }: Props) {
	const t = useT();
	const label = connected ? t('spy.player.online') : t('spy.player.offline');
	return (
		<span
			role="img"
			className={cn(
				'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
				connected ? 'bg-success' : 'bg-muted',
				className,
			)}
			title={label}
			aria-label={label}
		/>
	);
}
