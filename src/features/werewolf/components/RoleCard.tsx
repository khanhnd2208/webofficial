'use client';

import { useEffect, useRef, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { CARD_BACK_IMAGE, getRoleById } from '@/features/werewolf/config/roles';
import { withBasePath } from '@/features/spy-fall/lib/basePath';
import { cn } from '@/features/spy-fall/lib/cn';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import type { Faction } from '@/features/werewolf/types';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';

const FACTION_CHIP: Record<Faction, string> = {
	villager: 'bg-emerald-700/90 text-white',
	werewolf: 'bg-rose-800/90 text-white',
	solo: 'bg-violet-800/90 text-white',
};

interface Props {
	roleId: string | null;
	onViewed: () => Promise<unknown> | void;
}

export default function RoleCard({ roleId, onViewed }: Props) {
	const t = useT();
	const [revealed, setRevealed] = useState(false);
	const reported = useRef(false);
	const role = roleId ? getRoleById(roleId) : undefined;
	const faceSrc = role ? withBasePath(role.image) : null;

	useEffect(() => {
		if (!faceSrc) return;
		const preload = new Image();
		preload.src = faceSrc;
	}, [faceSrc]);

	function startHold() {
		if (!role) return;
		hapticLight();
		setRevealed(true);
		if (reported.current) return;
		reported.current = true;
		void Promise.resolve(onViewed()).catch(() => {
			reported.current = false;
		});
	}

	function endHold() {
		setRevealed(false);
	}

	const showFace = revealed && role;

	return (
		<div className="flex flex-col items-center gap-3">
			<p className="flex items-center gap-2 text-center text-sm text-muted-foreground"><GameIcon name="lock" size={15} />{t('mafia.card.privacy')}</p>
			<div
				role="button"
				tabIndex={0}
				aria-label={t('mafia.card.hold')}
				className={cn(
					'relative aspect-[2/3] w-[88vw] max-h-[70vh] max-w-[340px] touch-none select-none overflow-hidden rounded-2xl border-2 border-[color:var(--game-line)] shadow-[0_18px_50px_rgb(0_0_0_/_0.28)]',
					showFace ? '' : 'cursor-pointer',
				)}
				onPointerDown={startHold}
				onPointerUp={endHold}
				onPointerLeave={endHold}
				onPointerCancel={endHold}
				onContextMenu={(event) => event.preventDefault()}
			>
				<img
					src={withBasePath(CARD_BACK_IMAGE)}
					alt=""
					draggable={false}
					className={cn('pointer-events-none h-full w-full object-cover', showFace && 'invisible absolute')}
				/>
				{faceSrc ? (
					<img
						src={faceSrc}
						alt={showFace ? t(`mafia.role.${role.roleId}.name`) : ''}
						draggable={false}
						className={cn(
							'pointer-events-none h-full w-full object-cover',
							showFace ? 'absolute inset-0' : 'invisible absolute',
						)}
					/>
				) : null}
				{showFace ? (
					<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 text-white">
						<span className={cn('mx-auto mb-2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider', FACTION_CHIP[role.faction])}>
							{t(`mafia.faction.${role.faction}`)}
						</span>
						<h2 className="font-display text-center text-2xl font-bold">{t(`mafia.role.${role.roleId}.name`)}</h2>
						<p className="mt-2 text-center text-xs leading-relaxed text-white/90 sm:text-sm">
							{t(`mafia.role.${role.roleId}.desc`)}
						</p>
					</div>
				) : null}
			</div>
			<p className="flex items-center gap-2 text-center text-xs text-muted-foreground"><GameIcon name="eye" size={14} />{t('mafia.card.hold')}</p>
		</div>
	);
}
