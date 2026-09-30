'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Dossier, Sheet } from '@/features/spy-fall/components/ui';
import type { SpyCount } from '@/features/spy-fall/config/spyGame';
import type { PlayerSelfDTO } from '@/features/spy-fall/types/spyGame';

import RoleDossierContent from './RoleDossierContent';

export function RoleSheet({
	open,
	onClose,
	self,
	spyCount,
}: {
	open: boolean;
	onClose: () => void;
	self: PlayerSelfDTO;
	spyCount: SpyCount;
}) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);

	useEffect(() => {
		if (!open) startTransition(() => setRevealed(false));
	}, [open]);

	const handlePointerDown = useCallback(() => setRevealed(true), []);
	const handlePointerUp = useCallback(() => setRevealed(false), []);

	return (
		<Sheet open={open} onClose={onClose} title={t('spy.actions.myWord')}>
			<p className="mb-4 text-center text-sm text-muted-foreground">
				{t('spy.roleReveal.peekHint')}
			</p>
			<Dossier revealed={revealed} onRevealStart={handlePointerDown} onRevealEnd={handlePointerUp}>
				<RoleDossierContent self={self} spyCount={spyCount} />
			</Dossier>
		</Sheet>
	);
}
