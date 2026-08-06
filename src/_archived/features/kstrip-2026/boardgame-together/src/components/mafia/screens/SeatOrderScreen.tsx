'use client';

import { useCallback, useRef, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import { sortPlayersBySeat, useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import { Button } from '@/components/ui';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { getRoleById } from '@/config/mafiaGame';
import { roleName } from '@/lib/mafia/localize';
import type { Player } from '@/types/mafiaGame';

interface SortablePlayerListProps {
	players: Player[];
	onReorder: (orderedIds: string[]) => void;
	showRole?: boolean;
	t?: (key: string, params?: Record<string, string | number>) => string;
}

export function SortablePlayerList({ players, onReorder, showRole, t }: SortablePlayerListProps) {
	const sorted = sortPlayersBySeat(players);
	const dragIndex = useRef<number | null>(null);
	const [dragOver, setDragOver] = useState<number | null>(null);
	const [dragging, setDragging] = useState<number | null>(null);

	const moveItem = useCallback(
		(from: number, to: number) => {
			if (from === to) return;
			const ids = sorted.map((p) => p.id);
			const [item] = ids.splice(from, 1);
			ids.splice(to, 0, item!);
			hapticMedium();
			onReorder(ids);
		},
		[sorted, onReorder],
	);

	const endDrag = useCallback(
		(targetIndex: number) => {
			if (dragIndex.current !== null && dragIndex.current !== targetIndex) {
				moveItem(dragIndex.current, targetIndex);
			}
			dragIndex.current = null;
			setDragOver(null);
			setDragging(null);
		},
		[moveItem],
	);

	return (
		<ul className="space-y-2">
			{sorted.map((player, index) => (
				<li
					key={player.id}
					className={cn(
						'relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-150',
						mafiaGlass,
						dragging === index && 'z-10 scale-[1.03] shadow-xl shadow-black/40',
						dragOver === index && dragging !== index && 'border-[var(--mafia-gold)]',
					)}
					onPointerEnter={() => {
						if (dragIndex.current !== null && dragIndex.current !== index) {
							setDragOver(index);
						}
					}}
					onPointerUp={() => endDrag(index)}
					onPointerLeave={() => {
						if (dragging !== index) setDragOver(null);
					}}
				>
					{dragOver === index && dragging !== null && dragging !== index ? (
						<div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-[var(--mafia-gold)]" />
					) : null}

					<button
						type="button"
						className="flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-lg text-[var(--mafia-muted)] hover:bg-white/5 active:cursor-grabbing"
						aria-label={t?.('mafia.seat.dragAria') ?? 'Drag to reorder'}
						onPointerDown={(e) => {
							e.stopPropagation();
							dragIndex.current = index;
							setDragging(index);
						}}
					>
						≡
					</button>

					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mafia-surface-elevated)] text-sm font-semibold text-[var(--mafia-gold)]">
						{index + 1}
					</span>
					<span className="flex-1 font-medium text-[var(--mafia-foreground)]">{player.name}</span>
					{showRole && player.roleId ? (
						<span className="text-xs text-[var(--mafia-muted)]">
							{t && getRoleById(player.roleId) ? roleName(player.roleId, t) : player.roleId}
						</span>
					) : null}
					<div className="flex flex-col gap-0.5">
						<button
							type="button"
							className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--mafia-muted)] hover:bg-white/5 hover:text-[var(--mafia-foreground)] disabled:opacity-30"
							disabled={index === 0}
							onClick={() => moveItem(index, index - 1)}
							aria-label={t?.('mafia.seat.upAria') ?? 'Up'}
						>
							▲
						</button>
						<button
							type="button"
							className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--mafia-muted)] hover:bg-white/5 hover:text-[var(--mafia-foreground)] disabled:opacity-30"
							disabled={index === sorted.length - 1}
							onClick={() => moveItem(index, index + 1)}
							aria-label={t?.('mafia.seat.downAria') ?? 'Down'}
						>
							▼
						</button>
					</div>
				</li>
			))}
		</ul>
	);
}

export default function SeatOrderScreen() {
	const { game, reorderPlayers, setPassDirection, updateGame } = useMafiaGame();
	const t = useT();
	const sorted = sortPlayersBySeat(game.players);
	const chain = sorted.map((p) => p.name).join(' → ');

	return (
		<MafiaScreen
			footer={
				<Button fullWidth className={mafiaPrimary} onClick={() => updateGame({ status: 'SETUP_ROLES' })}>
					{t('mafia.seat.continue')}
				</Button>
			}
		>
			<MafiaHeader
				title={t('mafia.seat.title')}
				subtitle={t('mafia.seat.subtitle')}
				onBack={() => updateGame({ status: 'SETUP_PLAYERS' })}
			/>

			<SortablePlayerList players={game.players} onReorder={(ids) => reorderPlayers(ids)} t={t} />

			<div className="mt-4 flex flex-wrap gap-2">
				<Button
					variant={game.passDirection === 'clockwise' ? 'primary' : 'secondary'}
					size="sm"
					className={
						game.passDirection === 'clockwise'
							? mafiaPrimary
							: 'border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]'
					}
					onClick={() => {
						hapticLight();
						setPassDirection('clockwise');
					}}
				>
					{t('mafia.seat.clockwise')}
				</Button>
				<Button
					variant={game.passDirection === 'counterclockwise' ? 'primary' : 'secondary'}
					size="sm"
					className={
						game.passDirection === 'counterclockwise'
							? mafiaPrimary
							: 'border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]'
					}
					onClick={() => {
						hapticLight();
						setPassDirection('counterclockwise');
					}}
				>
					{t('mafia.seat.counterClockwise')}
				</Button>
			</div>

			<div className={cn('mt-4 p-4', mafiaGlass)}>
				<p className="text-xs text-[var(--mafia-muted)]">{t('mafia.seat.passPreview')}</p>
				<p className="mt-1 text-sm font-medium text-[var(--mafia-foreground)]">{chain}</p>
			</div>
		</MafiaScreen>
	);
}
