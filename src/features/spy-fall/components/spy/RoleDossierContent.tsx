'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import type { PlayerSelfDTO } from '@/features/spy-fall/types/spyGame';

interface Props {
	self: PlayerSelfDTO;
}

export default function RoleDossierContent({ self }: Props) {
	const t = useT();

	return (
		<>
			<p className="font-mono text-xs uppercase tracking-wide text-muted">{t('spy.roleReveal.keyword')}</p>
			<p className="mt-3 break-words text-center font-display text-4xl font-bold leading-tight text-ink">
				{self.keyword ?? '???'}
			</p>
			<p className="mt-4 px-2 text-xs text-muted-foreground">{t('spy.roleReveal.unknownSide')}</p>
		</>
	);
}
