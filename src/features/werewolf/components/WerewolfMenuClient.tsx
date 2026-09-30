'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import PrefsToggleGroup from '@/features/board-game-shared/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/board-game-shared/components/PlayerNameInput';
import { Button, Card, Field } from '@/features/board-game-shared/components/ui';
import GameIcon from '@/features/board-game-shared/components/ui/GameIcon';
import { hapticLight } from '@/features/board-game-shared/lib/haptics';
import {
	isValidPlayerName,
	normalizePlayerName,
} from '@/features/board-game-shared/lib/playerName';
import { postWerewolfAction } from '@/features/werewolf/lib/api';
import {
	getRecentPlayerName,
	storePlayerToken,
	storeRecentPlayerName,
} from '@/features/werewolf/lib/clientToken';
import type { RoomStateDTO } from '@/features/werewolf/types';

type View = 'menu' | 'create' | 'join';

export default function WerewolfMenuClient({ isAdmin = false }: { isAdmin?: boolean }) {
	const t = useT();
	const router = useRouter();
	const [view, setView] = useState<View>('menu');
	const [name, setName] = useState('');
	const [joinCode, setJoinCode] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | null>(null);

	useEffect(() => {
		setName(getRecentPlayerName() ?? '');
	}, []);

	function validateName(): string | null {
		if (!isValidPlayerName(name)) return t('spy.lobby.nameInvalid');
		return null;
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		const err = validateName();
		if (err) {
			setNameError(err);
			return;
		}
		const hostName = normalizePlayerName(name);
		setBusy(true);
		setError(null);
		hapticLight();
		try {
			const data = await postWerewolfAction<{ state: RoomStateDTO; hostToken: string }>(
				'/api/ma-soi/rooms',
				{
					hostName,
				},
			);
			storePlayerToken(data.state.code, data.hostToken);
			storeRecentPlayerName(hostName);
			router.push(routes.maSoiRoom(data.state.code));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}

	function handleJoin(e: React.FormEvent) {
		e.preventDefault();
		const err = validateName();
		if (err) {
			setNameError(err);
			return;
		}
		const code = joinCode.trim().toUpperCase();
		if (code.length !== 6) {
			setCodeError(t('mafia.menu.codeTooShort'));
			return;
		}
		setCodeError(null);
		const playerName = normalizePlayerName(name);
		storeRecentPlayerName(playerName);
		hapticLight();
		router.push(`${routes.maSoiRoom(code)}?name=${encodeURIComponent(playerName)}`);
	}

	return (
		<div className="game-theme game-theme-werewolf">
			<div className="relative mx-auto max-w-3xl px-4 py-5 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
				<div className="mb-5 flex items-center justify-between gap-4">
					<Link
						href={routes.boardGame}
						className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted transition hover:text-foreground"
					>
						<GameIcon name="arrow-left" size={15} />
						{t('mafia.menu.backToHub')}
					</Link>
					<PrefsToggleGroup />
					{isAdmin ? (
						<Link
							href={`${routes.boardGameTest}?game=ma-soi`}
							className="rounded-full border border-vermilion/40 px-3 py-2 text-xs text-ink"
						>
							{t('testRoom.title')}
						</Link>
					) : null}
				</div>
				<header className="game-theme-hero rounded-[1.25rem]">
					<Image
						src="/brand/myspace/ma-soi-menu-poster.webp"
						unoptimized
						alt={t('mafia.menu.posterAlt')}
						fill
						priority
						className="game-theme-hero-image"
						sizes="(max-width: 768px) 100vw, 768px"
					/>
					<div className="relative z-10 flex min-h-[18rem] flex-col justify-between p-6 sm:min-h-[20rem] sm:p-9">
						<div className="flex items-start justify-between gap-6">
							<div className="game-theme-mark">
								<GameIcon name="wolf" size={30} />
							</div>
							<p className="game-theme-kicker max-w-[9rem] text-right">{t('mafia.menu.eyebrow')}</p>
						</div>
						<div className="max-w-md">
							<h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
								{t('mafia.menu.title')}
							</h1>
							<p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground-secondary sm:text-base">
								{t('mafia.menu.subtitle')}
							</p>
							<div className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
								<span className="rounded-full border border-border/80 bg-background/40 px-3 py-1.5">
									<GameIcon name="users" size={13} className="mr-1.5 inline" />
									{t('mafia.menu.playerCount')}
								</span>
								<span className="rounded-full border border-border/80 bg-background/40 px-3 py-1.5">
									<GameIcon name="moon" size={13} className="mr-1.5 inline" />
									{t('mafia.menu.nightTag')}
								</span>
							</div>
						</div>
					</div>
				</header>

				<Card
					elevated
					className="game-theme-panel relative z-20 mx-auto -mt-6 max-w-xl space-y-4 rounded-[1.15rem] p-5 sm:p-7"
				>
					{view === 'menu' ? (
						<div className="space-y-3">
							<Button type="button" fullWidth onClick={() => setView('create')}>
								<GameIcon name="lantern" size={18} />
								{t('mafia.menu.create')}
							</Button>
							<Button type="button" fullWidth variant="secondary" onClick={() => setView('join')}>
								<GameIcon name="lock" size={18} />
								{t('mafia.menu.join')}
							</Button>
						</div>
					) : null}

					{view === 'create' ? (
						<form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
							<Field label={t('mafia.menu.hostName')} htmlFor="host-name" error={nameError}>
								<PlayerNameInput
									id="host-name"
									value={name}
									maxLength={24}
									placeholder={t('mafia.menu.namePlaceholder')}
									error={Boolean(nameError)}
									onChange={(e) => {
										setName(e.target.value);
										setNameError(null);
									}}
								/>
							</Field>
							{error ? <p className="text-sm text-danger">{error}</p> : null}
							<Button type="submit" fullWidth loading={busy}>
								<GameIcon name="lantern" size={18} />
								{t('mafia.menu.create')}
							</Button>
							<Button type="button" fullWidth variant="ghost" onClick={() => setView('menu')}>
								<GameIcon name="arrow-left" size={15} />
								{t('mafia.menu.back')}
							</Button>
						</form>
					) : null}

					{view === 'join' ? (
						<form onSubmit={handleJoin} className="space-y-4">
							<Field label={t('mafia.menu.code')} htmlFor="room-code" error={codeError}>
								<input
									id="room-code"
									value={joinCode}
									onChange={(e) => {
										setJoinCode(e.target.value.toUpperCase());
										setCodeError(null);
									}}
									placeholder={t('mafia.menu.codePlaceholder')}
									maxLength={8}
									autoCapitalize="characters"
									className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 font-mono text-lg tracking-[0.2em] uppercase"
								/>
							</Field>
							<Field label={t('mafia.menu.yourName')} htmlFor="join-name" error={nameError}>
								<PlayerNameInput
									id="join-name"
									value={name}
									maxLength={24}
									placeholder={t('mafia.menu.namePlaceholder')}
									error={Boolean(nameError)}
									onChange={(e) => {
										setName(e.target.value);
										setNameError(null);
									}}
								/>
							</Field>
							<Button type="submit" fullWidth>
								<GameIcon name="lock" size={18} />
								{t('mafia.menu.join')}
							</Button>
							<Button type="button" fullWidth variant="ghost" onClick={() => setView('menu')}>
								<GameIcon name="arrow-left" size={15} />
								{t('mafia.menu.back')}
							</Button>
						</form>
					) : null}
				</Card>
			</div>
		</div>
	);
}
