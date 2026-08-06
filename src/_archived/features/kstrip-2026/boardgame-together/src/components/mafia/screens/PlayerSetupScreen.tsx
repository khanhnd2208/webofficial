'use client';

import { useCallback, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import MafiaHeader from '@/components/mafia/MafiaHeader';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { mafiaGlass, mafiaPrimary } from '@/components/mafia/mafiaStyles';
import {
	MAX_PLAYERS,
	MIN_PLAYERS,
	useMafiaGame,
} from '@/components/mafia/hooks/useMafiaGame';
import { Button, Field, Input } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface PlayerInputRowProps {
	index: number;
	value: string;
	onChange: (value: string) => void;
	onRemove: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	canRemove: boolean;
	t: (key: string, params?: Record<string, string | number>) => string;
}

export function PlayerInputRow({
	index,
	value,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
	canRemove,
	t,
}: PlayerInputRowProps) {
	return (
		<div className={cn('flex items-center gap-2 p-2', mafiaGlass)}>
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--mafia-surface-elevated)] text-sm font-semibold text-[var(--mafia-gold)]">
				{index + 1}
			</span>
			<div className="flex shrink-0 flex-col gap-0.5">
				<button
					type="button"
					onClick={onMoveUp}
					disabled={!onMoveUp}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--mafia-muted)] hover:bg-white/5 hover:text-[var(--mafia-foreground)] disabled:opacity-30"
					aria-label={t('mafia.setupPlayers.moveUpAria')}
				>
					▲
				</button>
				<button
					type="button"
					onClick={onMoveDown}
					disabled={!onMoveDown}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--mafia-muted)] hover:bg-white/5 hover:text-[var(--mafia-foreground)] disabled:opacity-30"
					aria-label={t('mafia.setupPlayers.moveDownAria')}
				>
					▼
				</button>
			</div>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t('mafia.setupPlayers.placeholder')}
				className="flex-1 border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] text-[var(--mafia-foreground)] placeholder:text-[var(--mafia-muted)]"
			/>
			<button
				type="button"
				onClick={onRemove}
				disabled={!canRemove}
				className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--mafia-muted)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
				aria-label={t('mafia.setupPlayers.removeAria')}
			>
				✕
			</button>
		</div>
	);
}

export default function PlayerSetupScreen() {
	const { setPlayers, cancelGame } = useMafiaGame();
	const t = useT();
	const [names, setNames] = useState<string[]>(['', '', '', '', '']);
	const [pasteText, setPasteText] = useState('');
	const [showPaste, setShowPaste] = useState(false);

	const addPlayer = useCallback(() => {
		if (names.length >= MAX_PLAYERS) return;
		hapticLight();
		setNames((prev) => [...prev, '']);
	}, [names.length]);

	const removePlayer = useCallback((index: number) => {
		setNames((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const updateName = useCallback((index: number, value: string) => {
		setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
	}, []);

	const movePlayer = useCallback((from: number, to: number) => {
		setNames((prev) => {
			const next = [...prev];
			const [item] = next.splice(from, 1);
			next.splice(to, 0, item!);
			return next;
		});
	}, []);

	const handlePaste = useCallback(() => {
		const lines = pasteText
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter(Boolean);
		if (lines.length > 0) {
			setNames(lines.slice(0, MAX_PLAYERS));
			setShowPaste(false);
			setPasteText('');
		}
	}, [pasteText]);

	const validNames = names.map((n) => n.trim()).filter(Boolean);
	const canContinue = validNames.length >= MIN_PLAYERS && validNames.length <= MAX_PLAYERS;

	const localDuplicates = (() => {
		const counts = new Map<string, number>();
		for (const n of validNames) counts.set(n, (counts.get(n) ?? 0) + 1);
		return [...counts.entries()].filter(([, c]) => c > 1).map(([name]) => name);
	})();

	const handleContinue = () => {
		if (!canContinue) return;
		setPlayers(validNames);
	};

	return (
		<MafiaScreen
			footer={
				<Button fullWidth disabled={!canContinue} className={mafiaPrimary} onClick={handleContinue}>
					{t('mafia.setupPlayers.continue')}
				</Button>
			}
		>
			<MafiaHeader
				title={t('mafia.setupPlayers.title')}
				subtitle={t('mafia.setupPlayers.subtitle', { min: MIN_PLAYERS, max: MAX_PLAYERS })}
				onBack={cancelGame}
			/>

			<div className="space-y-2">
				{names.map((name, i) => (
					<PlayerInputRow
						key={i}
						index={i}
						value={name}
						onChange={(v) => updateName(i, v)}
						onRemove={() => removePlayer(i)}
						onMoveUp={i > 0 ? () => movePlayer(i, i - 1) : undefined}
						onMoveDown={i < names.length - 1 ? () => movePlayer(i, i + 1) : undefined}
						canRemove={names.length > MIN_PLAYERS}
						t={t}
					/>
				))}
			</div>

			{localDuplicates.length > 0 ? (
				<p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
					{t('mafia.setupPlayers.duplicate', { name: localDuplicates[0]! })}
				</p>
			) : null}

			<div className="mt-4 flex flex-col gap-2">
				<Button
					type="button"
					variant="secondary"
					className="border-[var(--mafia-border)] bg-[var(--mafia-surface)] text-[var(--mafia-foreground)]"
					onClick={addPlayer}
					disabled={names.length >= MAX_PLAYERS}
				>
					{t('mafia.setupPlayers.add')}
				</Button>
				<Button
					type="button"
					variant="tertiary"
					className="text-[var(--mafia-muted)]"
					onClick={() => setShowPaste(!showPaste)}
				>
					{t('mafia.setupPlayers.pasteToggle')}
				</Button>
			</div>

			{showPaste ? (
				<div className={cn('mt-4 space-y-2 p-4', mafiaGlass)}>
					<Field label={t('mafia.setupPlayers.pasteLabel')}>
						<textarea
							value={pasteText}
							onChange={(e) => setPasteText(e.target.value)}
							rows={5}
							className="w-full rounded-xl border border-[var(--mafia-border)] bg-[var(--mafia-surface-elevated)] px-3 py-2 text-sm text-[var(--mafia-foreground)]"
							placeholder={'Minh\nLan\nHuy'}
						/>
					</Field>
					<Button type="button" className={mafiaPrimary} onClick={handlePaste}>
						{t('mafia.setupPlayers.pasteApply')}
					</Button>
				</div>
			) : null}
		</MafiaScreen>
	);
}
