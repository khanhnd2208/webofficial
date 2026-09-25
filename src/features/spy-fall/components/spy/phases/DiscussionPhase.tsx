'use client';

import { useMemo, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Badge, Button, Card, Panel } from '@/features/spy-fall/components/ui';
import { cn } from '@/features/spy-fall/lib/cn';
import { getPhaseHint } from '@/features/spy-fall/lib/spy/i18n';
import { playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import PlayerList from '../PlayerList';

interface Props {
	state: RoomStateDTO;
	onSuspect: (suspectTokens: string[] | null) => void;
	onNext?: () => void;
	busy?: boolean;
}

export default function DiscussionPhase({ state, onSuspect, onNext, busy }: Props) {
	const t = useT();
	const self = state.self;
	const needed = state.suspectsRequired ?? 1;
	const [selected, setSelected] = useState<string[]>(() => self?.publicSuspectTokens ?? []);
	const allSelected = selected.length === needed && needed > 0;

	const selectedPlayers = useMemo(
		() =>
			selected.map((token) => ({
				token,
				name: state.players.find((p) => p.token === token)?.name ?? '?',
			})),
		[selected, state.players],
	);

	function persist(next: string[]) {
		onSuspect(next);
	}

	function handleToggle(token: string) {
		if (token === self?.token) return;
		playTap();
		setSelected((prev) => {
			if (prev.includes(token)) {
				const next = prev.filter((tok) => tok !== token);
				persist(next);
				return next;
			}
			if (prev.length >= needed) return prev;
			const next = [...prev, token];
			persist(next);
			return next;
		});
	}

	function handleClear() {
		setSelected([]);
		onSuspect([]);
	}

	return (
		<div className="space-y-4">
			<Card className="text-center">
				<p className="font-mono text-[10px] uppercase tracking-widest text-muted">
					{t('spy.discussion.suspecting')}
				</p>
				<p
					className={cn(
						'font-display mt-1 text-3xl font-bold tabular-nums',
						allSelected ? 'text-success' : selected.length > 0 ? 'text-warning' : 'text-ink',
					)}
				>
					{selected.length}/{needed}
				</p>
				{allSelected ? (
					<p className="mt-1 text-sm font-semibold text-success">{t('spy.discussion.enough')}</p>
				) : null}
			</Card>

			<Panel title={t('spy.discussion.title')} description={getPhaseHint(t, 'discussion')}>
				<p className="text-center text-sm text-muted-foreground">{t('spy.discussion.hint')}</p>
			</Panel>

			{selectedPlayers.length > 0 ? (
				<div className="flex flex-wrap justify-center gap-2">
					{selectedPlayers.map((p) => (
						<Badge key={p.token} variant="warning">
							{p.name}
						</Badge>
					))}
				</div>
			) : null}

			<PlayerList
				players={state.players}
				showSuspicion
				selectable
				selectedTokens={selected}
				onSelect={handleToggle}
			/>

			{self && selected.length > 0 ? (
				<Button variant="secondary" fullWidth size="md" disabled={busy} onClick={handleClear}>
					{t('spy.discussion.clear')}
				</Button>
			) : null}

			{state.isHost && onNext ? (
				<Button variant="primary" fullWidth loading={busy} onClick={onNext}>
					{t('spy.discussion.end')}
				</Button>
			) : !state.isHost ? (
				<p className="text-center text-sm text-muted-foreground">{t('spy.discussion.waitHost')}</p>
			) : null}
		</div>
	);
}
