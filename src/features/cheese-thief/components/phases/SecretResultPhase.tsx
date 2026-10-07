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

function Label({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-mono text-xs tracking-[0.18em] text-game-bronze uppercase">{children}</p>
	);
}

function Names({ names }: { names: string[] }) {
	return (
		<ul className="flex flex-wrap justify-center gap-2">
			{names.map((name) => (
				<li
					key={name}
					className="rounded-full border border-white/15! bg-white/10 px-3 py-1 text-base font-medium"
				>
					{name}
				</li>
			))}
		</ul>
	);
}

export default function SecretResultPhase({ card, seen, busy, onSeen }: Props) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);
	const empty = !card || (card.peek === null && card.allies === null && card.recruited === null);

	if (seen) {
		return (
			<div className="flex min-h-[70svh] items-center justify-center">
				<PutPhoneDown hint={t('cheese.result.waiting')} />
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-game-canvas px-5 text-game-ink">
			<div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-5 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
				<div className="flex flex-col items-center gap-3 text-center">
					<CheeseThiefArt scene="secret" size={64} />
					<p className="font-mono text-xs tracking-[0.18em] text-game-bronze uppercase">
						{t('cheese.secret.onlyYou')}
					</p>
					<h1 className="font-display text-3xl font-medium">{t('cheese.result.title')}</h1>
				</div>
				<HoldToReveal
					cover={t('cheese.result.cover')}
					hint={t('cheese.secret.holdHint')}
					onFirstReveal={() => setRevealed(true)}
				>
					<div className="flex w-full flex-col gap-5 divide-y divide-white/10!">
						{empty && (
							<div className="space-y-2">
								<p className="font-display text-2xl leading-snug">{t('cheese.result.nothing')}</p>
								<p className="text-sm leading-relaxed text-game-ink/65">
									{t('cheese.result.nothingWhy')}
								</p>
							</div>
						)}
						{card?.peek && (
							<div className="space-y-1">
								<Label>{t('cheese.result.peekLabel', { name: card.peek.name })}</Label>
								<p className="font-display text-5xl leading-tight tabular-nums">
									{t('cheese.result.hours', { hours: card.peek.hours.join(' · ') })}
								</p>
							</div>
						)}
						{card?.allies && (
							<div className="space-y-3 pt-5 first:pt-0">
								<Label>{t('cheese.result.alliesLabel')}</Label>
								<Names names={card.allies} />
							</div>
						)}
						{card?.recruited && (
							<div className="space-y-3 pt-5 first:pt-0">
								<Label>{t('cheese.result.recruitedLabel')}</Label>
								<p className="text-lg leading-relaxed">
									{card.recruited.thiefName
										? t('cheese.result.thiefIs', { name: card.recruited.thiefName })
										: t('cheese.result.thiefHidden')}
								</p>
								{card.recruited.allyNames.length > 0 && (
									<p className="text-base leading-relaxed text-game-ink/85">
										{t('cheese.result.alliesAre', {
											names: card.recruited.allyNames.join(', '),
										})}
									</p>
								)}
							</div>
						)}
					</div>
				</HoldToReveal>
				{revealed ? (
					<div className="space-y-3">
						<p className="text-center text-sm leading-relaxed text-game-ink/75">
							{t('cheese.result.memorize')}
						</p>
						<Button fullWidth disabled={busy} loading={busy} onClick={onSeen}>
							{t('cheese.result.seen')}
						</Button>
					</div>
				) : (
					<p className="rounded-2xl border border-dashed border-white/20! px-4 py-3 text-center text-sm text-game-ink/70">
						{t('cheese.deal.holdFirst')}
					</p>
				)}
			</div>
		</div>
	);
}
