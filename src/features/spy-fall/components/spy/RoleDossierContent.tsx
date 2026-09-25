'use client';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Stamp } from '@/features/spy-fall/components/ui';
import type { SpyCount } from '@/features/spy-fall/config/spyGame';
import { getRoleLabel } from '@/features/spy-fall/lib/spy/i18n';
import type { PlayerSelfDTO } from '@/features/spy-fall/types/spyGame';

interface Props {
	self: PlayerSelfDTO;
	spyCount: SpyCount;
}

/** The secret card: always the word, plus the role only when the room tells players their role. */
export default function RoleDossierContent({ self, spyCount }: Props) {
	const t = useT();
	const role = self.role;

	let hint: string;
	const many = spyCount > 1;
	if (role === 'spy') hint = t(many ? 'spy.roleReveal.spyHintMany' : 'spy.roleReveal.spyHint', { count: spyCount });
	else if (role === 'civilian') hint = t('spy.roleReveal.civilianHint');
	else hint = t(many ? 'spy.roleReveal.unknownSideMany' : 'spy.roleReveal.unknownSide', { count: spyCount });

	return (
		<>
			<p className="font-mono text-xs uppercase tracking-wide text-muted">{t('spy.roleReveal.keyword')}</p>
			<p className="mt-3 break-words text-center font-display text-4xl font-bold leading-tight text-ink">
				{self.keyword ?? '???'}
			</p>
			{role ? (
				<div className="mt-4 flex flex-col items-center gap-2">
					<p className="font-mono text-xs uppercase tracking-wide text-muted">{t('spy.roleReveal.yourRole')}</p>
					<Stamp
						label={getRoleLabel(t, role)}
						variant={role === 'spy' ? 'classified' : 'declassified'}
					/>
				</div>
			) : null}
			<p className="mt-4 px-2 text-xs text-muted-foreground">{hint}</p>
		</>
	);
}
