'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { SortablePlayerList } from '@/components/mafia/screens/SeatOrderScreen';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';

export default function HostReorderScreen({ onDone }: { onDone: () => void }) {
	const { game, reorderPendingPlayers } = useMafiaGame();
	const t = useT();
	const viewed = game.players.filter((p) => p.viewStatus === 'VIEWED');
	const pending = game.players.filter((p) => p.viewStatus !== 'VIEWED');

	return (
		<MafiaScreen
			footer={
				<Button fullWidth className={mafiaPrimary} onClick={onDone}>
					{t('mafia.common.done')}
				</Button>
			}
		>
			<MafiaHeader title={t('mafia.reorder.title')} />

			{viewed.length > 0 ? (
				<section className="mb-6">
					<h2 className="mb-2 text-sm font-semibold text-[var(--mafia-muted)]">
						{t('mafia.reorder.viewed')}
					</h2>
					<ul className="space-y-1 text-sm text-[var(--mafia-muted)]">
						{viewed.map((p) => (
							<li key={p.id}>{p.name}</li>
						))}
					</ul>
				</section>
			) : null}

			<section>
				<h2 className="mb-2 text-sm font-semibold text-[var(--mafia-foreground)]">
					{t('mafia.reorder.pending')}
				</h2>
				<SortablePlayerList players={pending} onReorder={(ids) => reorderPendingPlayers(ids)} t={t} />
			</section>
		</MafiaScreen>
	);
}
