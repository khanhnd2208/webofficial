'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface HostGuardButtonProps {
	onPress: () => void;
	className?: string;
}

export default function HostGuardButton({ onPress, className }: HostGuardButtonProps) {
	const t = useT();

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={onPress}
			className={cn(
				'fixed right-4 z-50 min-h-11 min-w-11 rounded-full border border-[var(--mafia-border)] bg-[var(--mafia-surface)] p-2 backdrop-blur-md',
				'top-[max(1rem,env(safe-area-inset-top))]',
				className,
			)}
			aria-label={t('mafia.header.hostAria')}
		>
			<span className="text-lg" aria-hidden>
				🛡️
			</span>
		</Button>
	);
}
