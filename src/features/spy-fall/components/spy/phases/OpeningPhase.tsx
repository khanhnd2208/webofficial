'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Panel } from '@/features/spy-fall/components/ui';
import { getPhaseHint } from '@/features/spy-fall/lib/spy/i18n';
import { playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import PlayerList from '../PlayerList';

interface Props {
	state: RoomStateDTO;
	onSpoke: () => void;
	onHostMarkSpoke: (token: string, spoken: boolean) => void;
	busy?: boolean;
}

export default function OpeningPhase({ state, onSpoke, onHostMarkSpoke, busy }: Props) {
	const t = useT();
	const self = state.self;
	const allSpoken = state.players.every((p) => p.hasSpoken);
	const openingHint = getPhaseHint(t, 'opening');

	return (
		<div className="space-y-6">
			<Panel title={t('spy.phases.opening')} description={openingHint}>
				{openingHint ? (
					<p className="rounded-xl bg-info-subtle px-4 py-3 text-sm text-foreground-secondary">
						{openingHint}
					</p>
				) : null}
			</Panel>

			<PlayerList players={state.players} showSpoken />

			{self && !self.hasSpoken ? (
				<Button
					fullWidth
					loading={busy}
					onClick={() => {
						playTap();
						onSpoke();
					}}
				>
					{t('spy.opening.markSpoke')}
				</Button>
			) : null}

			{self?.hasSpoken && !allSpoken ? (
				<p className="text-center text-sm text-muted">{t('spy.opening.waitOthers')}</p>
			) : null}

			{state.isHost ? (
				<div className="border-t border-border pt-4">
					<div className="flex flex-wrap gap-2">
						{state.players.map((p) => (
							<Button
								key={p.token}
								variant="ghost"
								size="sm"
								disabled={busy}
								onClick={() => onHostMarkSpoke(p.token, !p.hasSpoken)}
							>
								{p.name}: {p.hasSpoken ? t('spy.opening.spoke') : t('spy.opening.markSpoke')}
							</Button>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
