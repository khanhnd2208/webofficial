'use client';

import { useCallback, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Dossier } from '@/features/spy-fall/components/ui';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar from '../ActionBar';
import RoleDossierContent from '../RoleDossierContent';
import StepGuide from '../StepGuide';

interface Props {
	state: RoomStateDTO;
	onConfirm: () => void;
	busy?: boolean;
}

function roleRevealStepsKey({ revealRoles, spyCount }: RoomStateDTO): string {
	const two = spyCount === 2 ? 'Two' : '';
	return revealRoles ? `spy.steps.roleRevealKnown${two}` : `spy.steps.roleReveal${two}`;
}

export default function RoleRevealPhase({ state, onConfirm, busy }: Props) {
	const t = useT();
	const self = state.self!;
	const [revealed, setRevealed] = useState(false);
	const [seen, setSeen] = useState(false);
	const ready = state.players.filter((p) => p.hasMemorizedRole).length;

	const handlePointerDown = useCallback(() => {
		setRevealed(true);
		setSeen(true);
	}, []);
	const handlePointerUp = useCallback(() => setRevealed(false), []);

	return (
		<>
			<div className="space-y-6">
				<StepGuide stepsKey={roleRevealStepsKey(state)} />
				<Dossier
					revealed={revealed}
					onRevealStart={handlePointerDown}
					onRevealEnd={handlePointerUp}
				>
					<RoleDossierContent self={self} spyCount={state.spyCount} />
				</Dossier>
				<p className="text-center text-sm text-muted-foreground">
					{t('spy.roleReveal.readyCount', { done: ready, total: state.players.length })}
				</p>
			</div>

			<ActionBar>
				<Button
					fullWidth
					disabled={busy || self.hasMemorizedRole || !seen}
					loading={busy}
					onClick={() => {
						playConfirm();
						onConfirm();
					}}
				>
					{self.hasMemorizedRole
						? t('spy.roleReveal.waitOthers')
						: seen
							? t('spy.roleReveal.memorized')
							: t('spy.roleReveal.holdFirst')}
				</Button>
			</ActionBar>
		</>
	);
}
