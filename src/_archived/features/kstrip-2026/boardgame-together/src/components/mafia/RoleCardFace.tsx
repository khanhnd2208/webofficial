'use client';

import { useT } from '@/components/i18n/LocaleProvider';
import { CARD_BACK_IMAGE, getRoleById } from '@/config/mafiaGame';
import { withBasePath } from '@/lib/basePath';
import { cn } from '@/lib/cn';
import {
	factionName,
	privateInformation,
	roleDescription,
	roleName,
	roleObjective,
} from '@/lib/mafia/localize';
import type { Faction, Player } from '@/types/mafiaGame';

interface RoleCardFaceProps {
	player: Player;
	revealed: boolean;
	className?: string;
}

const CARD_SIZE =
	'relative mx-auto aspect-[2/3] w-[88vw] max-h-[78vh] max-w-[380px] overflow-hidden rounded-2xl mafia-card-frame';

const IMAGE_CLASS =
	'h-full w-full object-cover brightness-110 saturate-110 contrast-105';

const FACTION_CHIP: Record<Faction, string> = {
	werewolf: 'bg-[var(--mafia-wolf)]/90 text-white',
	villager: 'bg-[var(--mafia-villager)]/90 text-white',
	solo: 'bg-[var(--mafia-solo)]/90 text-white',
};

export default function RoleCardFace({ player, revealed, className }: RoleCardFaceProps) {
	const t = useT();

	if (!revealed || !player.roleId) {
		return (
			<div className={cn(CARD_SIZE, className)}>
				<div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(201,162,39,0.4)]" />
				<img
					src={withBasePath(CARD_BACK_IMAGE)}
					alt=""
					className={`${IMAGE_CLASS} pointer-events-none`}
					draggable={false}
					style={{ WebkitTouchCallout: 'none' }}
				/>
			</div>
		);
	}

	const role = getRoleById(player.roleId);
	if (!role) return null;
	const localizedRoleName = roleName(role.roleId, t);

	return (
		<div className={cn(CARD_SIZE, className)}>
			<div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(201,162,39,0.45)]" />
			<img
				src={withBasePath(role.image)}
				alt={localizedRoleName}
				className={`absolute inset-0 ${IMAGE_CLASS} pointer-events-none`}
				draggable={false}
				style={{ WebkitTouchCallout: 'none' }}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
			<div className="relative flex h-full flex-col justify-end p-4 pb-5 text-white sm:p-5">
				<span
					className={cn(
						'mx-auto mb-2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider',
						FACTION_CHIP[role.faction],
					)}
				>
					{factionName(role.faction, t)}
				</span>
				<p className="text-center text-xs font-medium text-white/85">{player.name}</p>
				<h2 className="font-display mt-1 text-center text-2xl font-bold uppercase tracking-wide text-[var(--mafia-gold)] sm:text-3xl">
					{localizedRoleName}
				</h2>
				<p className="mt-3 text-center text-xs leading-relaxed text-white/90 sm:text-sm">
					{roleDescription(role.roleId, t)}
				</p>
				<p className="mt-2 text-center text-[11px] font-medium text-white/75">
					{roleObjective(role.roleId, role.faction, t)}
				</p>
				{player.privateInformation ? (
					<p className="mt-3 rounded-lg border border-white/10 bg-black/55 px-2.5 py-2 text-center text-xs leading-relaxed backdrop-blur-sm">
						{privateInformation(player.privateInformation, t)}
					</p>
				) : null}
			</div>
		</div>
	);
}
