'use client';

import { useState } from 'react';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import PutPhoneDown from '@/features/cheese-thief/components/PutPhoneDown';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import type { SecretCard } from '@/features/cheese-thief/lib/rules';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { Button } from '@/features/board-game-shared/components/ui';

interface Props {
	card: SecretCard | undefined;
	seen: boolean;
	busy: boolean;
	onSeen: () => void;
}

export default function SecretResultPhase({ card, seen, busy, onSeen }: Props) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);
	const empty = !card || (card.peek === null && card.allies === null && card.recruited === null);

	if (seen) {
		return (
			<div className="flex min-h-[70svh] items-center justify-center">
				<PutPhoneDown />
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-game-canvas px-5 text-game-ink">
			<div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
				<h1 className="text-center font-display text-3xl font-medium">
					{t('cheese.result.title')}
				</h1>
				<CheeseThiefArt scene="secret" size={76} className="self-center" />
				<HoldToReveal onFirstReveal={() => setRevealed(true)}>
					{empty && <p className="text-lg leading-relaxed">{t('cheese.result.nothing')}</p>}
					{card?.peek && (
						<p className="text-lg leading-relaxed">
							{card.peek.night
								? t('cheese.result.peekNight', {
										night: card.peek.night,
										name: card.peek.name,
										hours: card.peek.hours.join(', '),
									})
								: t('cheese.result.peek', {
										name: card.peek.name,
										hours: card.peek.hours.join(', '),
									})}
						</p>
					)}
					{card?.allies && (
						<p className="text-lg leading-relaxed">
							{t('cheese.result.allies', { names: card.allies.join(', ') })}
						</p>
					)}
					{card?.recruited && (
						<div className="space-y-2 text-lg leading-relaxed">
							<p>{t('cheese.result.recruited')}</p>
							{card.recruited.thiefName ? (
								<p>{t('cheese.result.thiefIs', { name: card.recruited.thiefName })}</p>
							) : (
								<p>{t('cheese.result.thiefHidden')}</p>
							)}
							{card.recruited.allyNames.length > 0 && (
								<p>
									{t('cheese.result.alliesAre', { names: card.recruited.allyNames.join(', ') })}
								</p>
							)}
						</div>
					)}
				</HoldToReveal>
				{revealed ? (
					<Button fullWidth disabled={busy} loading={busy} onClick={onSeen}>
						{t('cheese.result.seen')}
					</Button>
				) : (
					<p className="text-center text-sm text-game-ink/70">{t('cheese.deal.holdFirst')}</p>
				)}
			</div>
		</div>
	);
}
