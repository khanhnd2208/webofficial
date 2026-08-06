'use client';

import { useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { getRoleById } from '@/config/mafiaGame';
import { sortPlayersBySeat, useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { roleName } from '@/lib/mafia/localize';

export default function ReviewScreen() {
	const { game, assignRolesRandomly, updateGame } = useMafiaGame();
	const t = useT();
	const [showPlayers, setShowPlayers] = useState(false);
	const sorted = sortPlayersBySeat(game.players);

	return (
		<MafiaScreen
			footer={
				<Button fullWidth className={mafiaPrimary} onClick={assignRolesRandomly}>
					{t('mafia.review.deal')}
				</Button>
			}
		>
			<MafiaHeader
				title={t('mafia.review.title')}
				onBack={() => updateGame({ status: 'SETUP_PIN' })}
				backLabel={t('mafia.review.backEdit')}
			/>

			<section className={cn('p-4', mafiaGlass)}>
				<h2 className="font-semibold text-[var(--mafia-foreground)]">
					{t('mafia.review.playerCount', { count: game.players.length })}
				</h2>
				<button
					type="button"
					className="mt-1 text-sm text-[var(--mafia-gold)] hover:underline"
					onClick={() => setShowPlayers(!showPlayers)}
				>
					{showPlayers ? t('mafia.review.hideList') : t('mafia.review.showOrder')}
				</button>
				{showPlayers ? (
					<ol className="mt-2 list-inside list-decimal text-sm text-[var(--mafia-muted)]">
						{sorted.map((p) => (
							<li key={p.id}>{p.name}</li>
						))}
					</ol>
				) : null}
			</section>

			<section className={cn('mt-4 p-4', mafiaGlass)}>
				<h2 className="font-semibold text-[var(--mafia-foreground)]">{t('mafia.review.roleSet')}</h2>
				<ul className="mt-2 space-y-1 text-sm text-[var(--mafia-muted)]">
					{game.roleSelections.map((sel) => {
						const role = getRoleById(sel.roleId);
						return (
							<li key={sel.roleId}>
								{t('mafia.review.roleLine', {
									count: sel.count,
									roleName: role ? roleName(role.roleId, t) : sel.roleId,
								})}
							</li>
						);
					})}
				</ul>
			</section>

			<section className={cn('mt-4 p-4', mafiaGlass)}>
				<p className="text-sm text-[var(--mafia-muted)]">{t('mafia.review.pinSet')}</p>
			</section>
		</MafiaScreen>
	);
}
