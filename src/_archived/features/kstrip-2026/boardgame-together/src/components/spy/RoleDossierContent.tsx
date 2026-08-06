'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { Stamp } from '@/components/ui';
import { getRoleHint, getRoleLabel } from '@/lib/spy/i18n';
import type { PlayerSelfDTO } from '@/types/spyGame';

interface Props {
	self: PlayerSelfDTO;
	/** When true, only show the secret keyword — never role labels or teammate */
	hideRoles?: boolean;
}

export default function RoleDossierContent({ self, hideRoles }: Props) {
	const t = useT();

	if (hideRoles) {
		return (
			<>
				<Stamp label="Declassified" variant="declassified" className="mb-4" animate />
				<p className="font-mono text-xs uppercase tracking-wide text-muted">
					{t('spy.roleReveal.keyword')}
				</p>
				<p className="mt-2 font-display text-4xl font-bold text-ink">{self.keyword ?? '???'}</p>
				<p className="mt-4 px-4 text-xs text-muted-foreground">
					{t('spy.guide.sections.hiddenBody')}
				</p>
			</>
		);
	}

	return (
		<>
			<Stamp label="Declassified" variant="declassified" className="mb-4" animate />
			<p className="font-display mt-2 text-3xl font-bold text-ink">
				{self.role ? getRoleLabel(t, self.role) : '???'}
			</p>
			{self.role === 'mrwhite' ? (
				<div className="mt-4 space-y-2">
					<p className="text-lg">{t('spy.roleReveal.noKeyword')}</p>
					{self.teammateName ? (
						<p className="text-sm text-muted-foreground">
							<strong className="text-foreground">{self.teammateName}</strong>
						</p>
					) : null}
				</div>
			) : (
				<div className="mt-4 space-y-2">
					<p className="text-sm text-muted">{t('spy.roleReveal.keyword')}</p>
					<p className="mt-1 font-display text-4xl font-bold text-ink">{self.keyword}</p>
					{self.role === 'spy' && self.teammateName ? (
						<p className="text-sm text-muted-foreground">
							<strong className="text-foreground">{self.teammateName}</strong>
						</p>
					) : null}
				</div>
			)}
			{self.role ? (
				<p className="mt-4 px-4 text-xs text-muted-foreground">{getRoleHint(t, self.role)}</p>
			) : null}
		</>
	);
}
