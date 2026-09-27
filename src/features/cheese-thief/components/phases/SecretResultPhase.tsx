'use client';

import HoldToReveal from '@/features/cheese-thief/components/HoldToReveal';
import PutPhoneDown from '@/features/cheese-thief/components/PutPhoneDown';
import type { SecretCard } from '@/features/cheese-thief/lib/rules';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Button } from '@/features/spy-fall/components/ui';

interface Props {
	card: SecretCard | undefined;
	seen: boolean;
	busy: boolean;
	onSeen: () => void;
}

export default function SecretResultPhase({ card, seen, busy, onSeen }: Props) {
	const t = useT();
	const empty = !card || (card.peek === null && card.allies === null && card.recruited === null);

	if (seen) {
		return (
			<div className="flex min-h-[70svh] items-center justify-center">
				<PutPhoneDown />
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col justify-center gap-6 bg-[#0c0b09] px-5 text-[#f4efe4]">
			<h1 className="text-center font-display text-3xl font-medium">{t('cheese.result.title')}</h1>
			<HoldToReveal>
				{empty && <p className="text-lg leading-relaxed">{t('cheese.result.nothing')}</p>}
				{card?.peek && (
					<p className="text-lg leading-relaxed">
						{card.peek.night
							? t('cheese.result.peekNight', {
									night: card.peek.night,
									name: card.peek.name,
									hours: card.peek.hours.join(', '),
								})
							: t('cheese.result.peek', { name: card.peek.name, hours: card.peek.hours.join(', ') })}
					</p>
				)}
				{card?.allies && <p className="text-lg leading-relaxed">{t('cheese.result.allies', { names: card.allies.join(', ') })}</p>}
				{card?.recruited && (
					<div className="space-y-2 text-lg leading-relaxed">
						<p>{t('cheese.result.recruited')}</p>
						{card.recruited.thiefName && <p>{t('cheese.result.thiefIs', { name: card.recruited.thiefName })}</p>}
						{card.recruited.allyNames.length > 0 && (
							<p>{t('cheese.result.alliesAre', { names: card.recruited.allyNames.join(', ') })}</p>
						)}
					</div>
				)}
			</HoldToReveal>
			<Button fullWidth disabled={busy} loading={busy} onClick={onSeen}>
				{t('cheese.result.seen')}
			</Button>
		</div>
	);
}
