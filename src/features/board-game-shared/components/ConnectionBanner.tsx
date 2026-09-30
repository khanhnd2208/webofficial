'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';

interface Props {
	error: string | null;
	onRetry: () => void;
}

export default function ConnectionBanner({ error, onRetry }: Props) {
	const t = useT();
	if (!error) return null;

	return (
		<div
			className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-subtle px-4 py-3 text-sm"
			role="status"
		>
			<span className="text-warning-foreground">⚠ {error}</span>
			<button
				type="button"
				onClick={onRetry}
				className="min-h-9 shrink-0 rounded-lg px-2 font-semibold text-accent hover:underline"
			>
				{t('common.retry')}
			</button>
		</div>
	);
}
