'use client';

import { useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button, Panel } from '@/features/spy-fall/components/ui';
import { playConfirm, playTap } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import PlayerList from '../PlayerList';

interface Props {
	state: RoomStateDTO;
	onSubmit: (choices: string[]) => void;
	onNext?: () => void;
	busy?: boolean;
}

export default function RunoffPhase({ state, onSubmit, onNext, busy }: Props) {
	const t = useT();
	const runoff = state.runoff!;
	const candidates = state.players.filter((p) => runoff.candidateTokens.includes(p.token));
	const [selected, setSelected] = useState<string[]>(state.self?.runoffChoices ?? []);
	const [submitted, setSubmitted] = useState(
		(state.self?.runoffChoices?.length ?? 0) > 0,
	);

	function toggle(token: string) {
		playTap();
		setSelected((prev) => {
			if (prev.includes(token)) return prev.filter((tok) => tok !== token);
			if (prev.length >= runoff.slotsRemaining) return prev;
			return [...prev, token];
		});
	}

	return (
		<div className="space-y-4">
			<Panel
				title={t('spy.runoff.title')}
				description={t('spy.runoff.desc', { count: runoff.slotsRemaining })}
			/>

			<PlayerList
				players={candidates}
				selectable={!submitted}
				selectedToken={
					selected.length === 1
						? selected[0]!
						: selected.length > 1
							? selected[selected.length - 1]!
							: null
				}
				onSelect={toggle}
			/>

			{selected.length > 0 ? (
				<p className="text-center text-sm text-muted-foreground">
					{t('spy.runoff.picked')}{' '}
					{selected.map((tok) => candidates.find((c) => c.token === tok)?.name).join(', ')}
				</p>
			) : null}

			{!submitted ? (
				<Button
					fullWidth
					disabled={busy || selected.length === 0}
					loading={busy}
					onClick={() => {
						playConfirm();
						setSubmitted(true);
						onSubmit(selected);
					}}
				>
					{t('spy.runoff.submit')}
				</Button>
			) : null}

			{submitted && !state.isHost ? (
				<p className="text-center text-sm text-muted">{t('spy.runoff.waitHost')}</p>
			) : null}

			{state.isHost && onNext ? (
				<Button variant="primary" fullWidth loading={busy} onClick={onNext}>
					{t('spy.runoff.lock')}
				</Button>
			) : null}
		</div>
	);
}
