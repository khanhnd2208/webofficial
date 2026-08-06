'use client';

import { useEffect } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { ASSIGN_ANIMATION_MS, CARD_BACK_IMAGE } from '@/config/mafiaGame';
import { useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { withBasePath } from '@/lib/basePath';

export default function AssignAnimation() {
	const { setShowAssignAnimation } = useMafiaGame();
	const t = useT();

	useEffect(() => {
		const t = setTimeout(() => setShowAssignAnimation(false), ASSIGN_ANIMATION_MS);
		return () => clearTimeout(t);
	}, [setShowAssignAnimation]);

	return (
		<MafiaScreen center>
			<div className="relative flex gap-2 overflow-hidden rounded-2xl p-4">
				<div className="pointer-events-none absolute inset-0 animate-mafia-deal-sweep bg-gradient-to-r from-transparent via-[var(--mafia-gold-glow)] to-transparent" />
				{[0, 1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="relative h-24 w-16 overflow-hidden rounded-lg mafia-card-frame shadow-lg"
						style={{ animationDelay: `${i * 80}ms` }}
					>
						<img
							src={withBasePath(CARD_BACK_IMAGE)}
							alt=""
							className="h-full w-full object-cover"
							draggable={false}
						/>
					</div>
				))}
			</div>
			<p className="font-display mt-8 animate-mafia-rise-in text-lg font-semibold text-[var(--mafia-gold)]">
				{t('mafia.assign.animating')}
			</p>
		</MafiaScreen>
	);
}
