'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Panel } from '@/features/spy-fall/components/ui';
import { getPhaseHint } from '@/features/spy-fall/lib/spy/i18n';
import { playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

interface Props {
	state: RoomStateDTO;
	onResult: (correct: boolean) => void;
	busy?: boolean;
}

export default function MrWhiteGuessPhase({ state, onResult, busy }: Props) {
	const t = useT();
	const mw = state.mrWhite!;
	const mrWhitePlayer = state.players.find((p) => p.role === 'mrwhite' || p.token === mw.token);
	const hint = getPhaseHint(t, 'mrwhite-guess');

	return (
		<div className="space-y-6 text-center">
			<Panel title={t('spy.roles.mrwhite')} description={hint}>
				<p className="text-lg text-foreground">
					<strong className="text-ink">{mrWhitePlayer?.name ?? mw.playerName}</strong>
					{hint ? ` — ${hint}` : null}
				</p>
			</Panel>

			{mw.canConfirm ? (
				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="success"
						fullWidth
						loading={busy}
						onClick={() => {
							playTap();
							onResult(true);
						}}
					>
						{t('spy.result.mwCorrect')}
					</Button>
					<Button
						variant="destructive"
						fullWidth
						loading={busy}
						onClick={() => {
							playTap();
							onResult(false);
						}}
					>
						{t('spy.result.mwWrong')}
					</Button>
				</div>
			) : (
				<p className="text-muted">{t('spy.lobby.waitHost')}</p>
			)}
		</div>
	);
}
