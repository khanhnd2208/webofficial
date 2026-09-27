'use client';

import type { RoomStateDTO } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';

interface Props {
	state: RoomStateDTO;
	busy: boolean;
	onAgain: () => void;
}

export default function RevealPhase({ state, busy, onAgain }: Props) {
	const t = useT();
	const roster = state.roster ?? [];
	const flipped = roster.filter((row) => row.flipped);
	const thief = roster.find((row) => row.role === 'thief');
	const followers = roster.filter((row) => row.follower);
	const scapegoat = roster.find((row) => row.role === 'scapegoat');

	return (
		<div className="space-y-8">
			<section className="space-y-2 text-center">
				<p className="font-mono text-[0.68rem] tracking-[0.18em] text-muted uppercase">{t('cheese.reveal.flipped')}</p>
				{flipped.map((row) => (
					<div key={row.id}>
						<p className="font-display text-4xl font-medium">{row.name}</p>
						<p className="text-sm text-muted">{t(`cheese.deal.role.${row.role}`)}</p>
					</div>
				))}
			</section>

			<section className="space-y-1 text-center">
				<p className="text-sm text-muted">{t('cheese.reveal.thief')}</p>
				<p className="font-display text-3xl font-medium">{thief?.name}</p>
				<p className="pt-3 text-sm text-muted">
					{followers.length > 0 ? t('cheese.reveal.followers') : t('cheese.reveal.noFollowers')}
				</p>
				{followers.length > 0 && <p className="text-lg">{followers.map((row) => row.name).join(', ')}</p>}
				{scapegoat && (
					<p className="pt-3 text-sm text-muted">
						{t('cheese.reveal.scapegoat')} {scapegoat.name}
					</p>
				)}
			</section>

			{state.winner && (
				<p className="text-center font-display text-2xl font-medium">{t(`cheese.reveal.winner.${state.winner}`)}</p>
			)}

			<table className="w-full text-left text-sm">
				<thead className="font-mono text-[0.65rem] tracking-[0.14em] text-muted uppercase">
					<tr>
						<th className="py-2 font-normal">{t('cheese.reveal.colName')}</th>
						<th className="py-2 font-normal">{t('cheese.reveal.colRole')}</th>
						<th className="py-2 font-normal">{t('cheese.reveal.colHour')}</th>
						<th className="py-2 font-normal">{t('cheese.reveal.colHunch')}</th>
					</tr>
				</thead>
				<tbody>
					{roster.map((row) => (
						<tr key={row.id} className="border-t border-border">
							<td className="py-2 pr-2">{row.name}</td>
							<td className="py-2 pr-2">{t(`cheese.deal.role.${row.role}`)}</td>
							<td className="py-2 pr-2">{row.wakeHours.join(', ')}</td>
							<td className="py-2">
								{row.hunchCorrect === null
									? t('cheese.reveal.hunchNone')
									: row.hunchCorrect
										? t('cheese.reveal.hunchYes')
										: t('cheese.reveal.hunchNo')}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{state.isHost && (
				<Button fullWidth disabled={busy} loading={busy} onClick={onAgain}>
					{t('cheese.reveal.again')}
				</Button>
			)}
		</div>
	);
}
