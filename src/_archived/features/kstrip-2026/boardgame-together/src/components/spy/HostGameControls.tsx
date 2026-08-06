'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button } from '@/components/ui';
import { playConfirm, playTap } from '@/lib/sounds';
import type { GamePhase } from '@/types/spyGame';

interface Props {
	phase: GamePhase;
	busy?: boolean;
	onConfirmAll?: () => void;
	onRestart: () => void;
}

export default function HostGameControls({ phase, busy, onConfirmAll, onRestart }: Props) {
	const t = useT();
	const canConfirmAll = phase === 'role-reveal' || phase === 'opening';

	return (
		<div className="mt-6 space-y-3 border-t border-border pt-4">
			{canConfirmAll && onConfirmAll ? (
				<Button
					fullWidth
					variant="secondary"
					loading={busy}
					onClick={() => {
						playTap();
						onConfirmAll();
					}}
				>
					{t('spy.host.confirmAll')}
				</Button>
			) : null}

			<Button
				fullWidth
				variant="destructive"
				loading={busy}
				onClick={() => {
					const ok = window.confirm(t('spy.host.restartConfirm'));
					if (!ok) return;
					playConfirm();
					onRestart();
				}}
			>
				{t('spy.host.restart')}
			</Button>
		</div>
	);
}
