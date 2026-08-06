'use client';

import { useCallback, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button, Dossier } from '@/components/ui';
import { playConfirm } from '@/lib/sounds';
import type { PlayerSelfDTO } from '@/types/spyGame';

import RoleDossierContent from '../RoleDossierContent';

interface Props {
	self: PlayerSelfDTO;
	onConfirm: () => void;
	busy?: boolean;
	hideRoles?: boolean;
}

export default function RoleRevealPhase({ self, onConfirm, busy, hideRoles }: Props) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);

	const handlePointerDown = useCallback(() => setRevealed(true), []);
	const handlePointerUp = useCallback(() => setRevealed(false), []);

	return (
		<div className="space-y-6 text-center">
			<p className="text-sm text-muted-foreground">
				{hideRoles ? t('spy.roleReveal.keyword') : t('spy.phases.role-reveal')}
			</p>

			<Dossier
				revealed={revealed}
				onRevealStart={handlePointerDown}
				onRevealEnd={handlePointerUp}
			>
				<RoleDossierContent self={self} hideRoles={hideRoles} />
			</Dossier>

			<Button
				fullWidth
				disabled={busy || self.hasMemorizedRole}
				loading={busy}
				onClick={() => {
					playConfirm();
					onConfirm();
				}}
			>
				{self.hasMemorizedRole ? t('spy.opening.waitOthers') : t('spy.roleReveal.memorized')}
			</Button>
		</div>
	);
}
