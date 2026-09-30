'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';
import { playConfirm, playTap } from '@/features/spy-fall/lib/sounds';
import type { GamePhase } from '@/features/spy-fall/types/spyGame';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';

interface Props {
	phase: GamePhase;
	busy?: boolean;
	onConfirmAll?: () => void;
	onRestart: () => void;
}

/** Rarely needed host escape hatches, tucked away so they are not tapped by accident. */
export default function HostGameControls({ phase, busy, onConfirmAll, onRestart }: Props) {
	const t = useT();

	return (
		<details className="group rounded-xl border border-dashed border-border px-4 py-2 text-sm">
			<summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-muted">
				<span className="inline-flex items-center gap-2">
					<GameIcon name="settings" size={15} /> {t('spy.actions.hostTools')}
				</span>
				<span aria-hidden className="transition-transform group-open:rotate-180">
					<GameIcon name="chevron-down" size={16} />
				</span>
			</summary>
			<div className="space-y-2 pb-2 pt-1">
				{phase === 'role-reveal' && onConfirmAll ? (
					<Button
						fullWidth
						size="md"
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
					size="md"
					variant="ghost"
					loading={busy}
					className="text-danger"
					onClick={() => {
						if (!window.confirm(t('spy.host.restartConfirm'))) return;
						playConfirm();
						onRestart();
					}}
				>
					{t('spy.host.restart')}
				</Button>
			</div>
		</details>
	);
}
