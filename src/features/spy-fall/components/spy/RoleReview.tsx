'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Dossier, Sheet } from '@/features/spy-fall/components/ui';
import type { PlayerSelfDTO } from '@/features/spy-fall/types/spyGame';

import RoleDossierContent from './RoleDossierContent';

export function RoleFab({ onOpen }: { onOpen: () => void }) {
	const t = useT();
	return (
		<Button
			variant="secondary"
			size="md"
			onClick={onOpen}
			className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 h-12 w-12 rounded-full p-0 shadow-lg"
			aria-label={t('spy.phases.role-reveal')}
		>
			<span aria-hidden className="text-lg">
				🪪
			</span>
		</Button>
	);
}

export function RoleSheet({
	open,
	onClose,
	self,
	hideRoles,
}: {
	open: boolean;
	onClose: () => void;
	self: PlayerSelfDTO;
	hideRoles?: boolean;
}) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);

	useEffect(() => {
		if (!open) startTransition(() => setRevealed(false));
	}, [open]);

	const handlePointerDown = useCallback(() => setRevealed(true), []);
	const handlePointerUp = useCallback(() => setRevealed(false), []);

	return (
		<Sheet open={open} onClose={onClose} title={t('spy.phases.role-reveal')}>
			<p className="mb-4 text-center text-sm text-muted-foreground">
				{hideRoles ? t('spy.roleReveal.keyword') : t('spy.phases.role-reveal')}
			</p>
			<Dossier
				revealed={revealed}
				onRevealStart={handlePointerDown}
				onRevealEnd={handlePointerUp}
			>
				<RoleDossierContent self={self} hideRoles={hideRoles} />
			</Dossier>
		</Sheet>
	);
}
