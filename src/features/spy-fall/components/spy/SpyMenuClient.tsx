'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import {
	Button,
	Card,
	EmptyState,
	ErrorState,
	Field,
	Input,
	Skeleton,
} from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import { SPY_MAX_PLAYERS } from '@/features/spy-fall/config/spyGame';
import { withBasePath } from '@/features/spy-fall/lib/basePath';
import { postSpyAction } from '@/features/spy-fall/lib/spy/api';
import {
	getRecentPlayerName,
	storePlayerToken,
	storeRecentPlayerName,
} from '@/features/spy-fall/lib/spy/clientToken';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import { playConfirm, playTap } from '@/features/spy-fall/lib/sounds';
import PlayerNameInput from '@/features/spy-fall/components/spy/PlayerNameInput';
import type { PublicRoomListItemDTO, RoomStateDTO } from '@/features/spy-fall/types/spyGame';
import { routes } from '@/config/routes';

type View = 'menu' | 'create' | 'join' | 'public';

export default function SpyMenuClient() {
	const t = useT();
	const router = useRouter();
	const [view, setView] = useState<View>('menu');
	const [name, setName] = useState('');
	const [roomName, setRoomName] = useState('');
	const [joinCode, setJoinCode] = useState('');
	const [publicRooms, setPublicRooms] = useState<PublicRoomListItemDTO[]>([]);
	const [loadingPublic, setLoadingPublic] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);

	useEffect(() => {
		setName(getRecentPlayerName() ?? '');
	}, []);

	function validateName(): string | null {
		const normalized = normalizePlayerName(name);
		if (!isValidPlayerName(normalized)) {
			return t('spy.lobby.nameInvalid');
		}
		return null;
	}

	function handleMenuSubmit(e: React.FormEvent) {
		e.preventDefault();
		const err = validateName();
		if (err) {
			setNameError(err);
			return;
		}
		setNameError(null);
		setName(normalizePlayerName(name));
		playTap();
		setView('create');
	}

	async function loadPublicRooms() {
		setLoadingPublic(true);
		setError(null);
		try {
			const res = await fetch(withBasePath('/api/spy/rooms'));
			const json = (await res.json()) as { ok: boolean; data?: PublicRoomListItemDTO[] };
			if (json.ok && json.data) setPublicRooms(json.data);
		} catch {
			setError(t('spy.join.loadFailBody'));
		} finally {
			setLoadingPublic(false);
		}
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		const normalized = normalizePlayerName(name);
		const err = validateName();
		if (err) {
			setNameError(err);
			return;
		}
		setNameError(null);
		setBusy(true);
		setError(null);
		hapticLight();
		try {
			const data = await postSpyAction<{ state: RoomStateDTO; playerToken: string }>(
				'/api/spy/rooms',
				{
					name: roomName,
					hostName: normalized,
					maxPlayers: SPY_MAX_PLAYERS,
					topic: 'any',
					isPublic: true,
				},
			);
			storePlayerToken(data.state.code, data.playerToken);
			storeRecentPlayerName(normalized);
			playConfirm();
			router.push(`${routes.spyFallRoom(data.state.code)}?name=${encodeURIComponent(normalized)}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : t('spy.join.joinFail'));
		} finally {
			setBusy(false);
		}
	}

	function handleJoinSubmit(e: React.FormEvent) {
		e.preventDefault();
		const code = joinCode.trim().toUpperCase();
		if (!code) return;
		const normalized = normalizePlayerName(name);
		const err = validateName();
		if (err) {
			setNameError(err);
			return;
		}
		setNameError(null);
		hapticLight();
		playTap();
		storeRecentPlayerName(normalized);
		router.push(`${routes.spyFallRoom(code)}?name=${encodeURIComponent(normalized)}`);
	}

	return (
		<div className="game-theme game-theme-spy">
			<div className="relative mx-auto max-w-3xl px-4 py-5 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
				<div className="mb-5 flex items-center justify-between gap-4">
					<Link
						href={routes.boardGame}
						className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted transition hover:text-foreground"
					>
						<GameIcon name="arrow-left" size={15} />
						Board Game
					</Link>
					<PrefsToggleGroup />
				</div>

				<header className="game-theme-hero rounded-[1.25rem]">
					<Image
						src="/brand/myspace/spy-fall-menu-poster.webp"
						unoptimized
						alt={t('spy.menu.posterAlt')}
						fill
						priority
						className="game-theme-hero-image"
						sizes="(max-width: 768px) 100vw, 768px"
					/>
					<div className="relative z-10 flex min-h-[18rem] flex-col justify-between p-6 sm:min-h-[20rem] sm:p-9">
						<div className="flex items-start justify-between gap-6">
							<div className="game-theme-mark">
								<GameIcon name="spy" size={30} />
							</div>
							<p className="game-theme-kicker max-w-[9rem] text-right">Covert Expedition</p>
						</div>
						<div className="max-w-md">
							<h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
								{t('spy.menu.title')}
							</h1>
							<p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground-secondary sm:text-base">
								{t('spy.menu.subtitle')}
							</p>
							<div className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
								<span className="rounded-full border border-border/80 bg-background/40 px-3 py-1.5">
									<GameIcon name="users" size={13} className="mr-1.5 inline" />
									{t('spy.menu.playerCount')}
								</span>
								<span className="rounded-full border border-border/80 bg-background/40 px-3 py-1.5">
									<GameIcon name="target" size={13} className="mr-1.5 inline" />
									{t('spy.menu.spyCount')}
								</span>
							</div>
						</div>
					</div>
				</header>

				<Card
					elevated
					className="game-theme-panel relative z-20 mx-auto -mt-6 max-w-xl space-y-4 rounded-[1.15rem] p-5 sm:p-7"
				>
					{view === 'menu' && (
						<form onSubmit={handleMenuSubmit} className="space-y-4">
							<Field label={t('spy.menu.yourName')} htmlFor="spy-name" error={nameError}>
								<PlayerNameInput
									id="spy-name"
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										if (nameError) setNameError(null);
									}}
									maxLength={24}
									placeholder={t('spy.join.namePlaceholder')}
									error={Boolean(nameError)}
								/>
							</Field>

							<Button type="submit" fullWidth>
								<GameIcon name="compass" size={18} />
								{t('spy.menu.createRoom')}
							</Button>
							<Button
								type="button"
								fullWidth
								variant="secondary"
								onClick={() => {
									const err = validateName();
									if (err) {
										setNameError(err);
										return;
									}
									setNameError(null);
									setView('join');
								}}
							>
								<GameIcon name="lock" size={18} />
								{t('spy.menu.joinCode')}
							</Button>
							<Button
								type="button"
								fullWidth
								variant="tertiary"
								size="md"
								onClick={() => {
									const err = validateName();
									if (err) {
										setNameError(err);
										return;
									}
									setNameError(null);
									setView('public');
									void loadPublicRooms();
								}}
							>
								<GameIcon name="users" size={18} />
								{t('spy.menu.publicRooms')}
							</Button>
						</form>
					)}

					{view === 'create' && (
						<form onSubmit={handleCreate} className="space-y-4">
							<Button type="button" variant="ghost" size="sm" onClick={() => setView('menu')}>
								<GameIcon name="arrow-left" size={15} />
								{t('common.back')}
							</Button>
							<Field label={t('spy.menu.roomName')} htmlFor="room-name">
								<Input
									id="room-name"
									value={roomName}
									onChange={(e) => setRoomName(e.target.value)}
								/>
							</Field>
							{error ? <ErrorState message={error} /> : null}
							<Button type="submit" fullWidth loading={busy}>
								{busy ? t('spy.menu.creating') : t('spy.menu.create')}
							</Button>
						</form>
					)}

					{view === 'join' && (
						<form onSubmit={handleJoinSubmit} className="space-y-4">
							<Button type="button" variant="ghost" size="sm" onClick={() => setView('menu')}>
								<GameIcon name="arrow-left" size={15} />
								{t('common.back')}
							</Button>
							<Field
								label={t('spy.menu.missionCode')}
								htmlFor="join-code"
								hint={t('spy.menu.codeHint')}
							>
								<Input
									id="join-code"
									value={joinCode}
									onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
									maxLength={6}
									className="text-center font-mono text-2xl tracking-[0.3em] uppercase"
									placeholder="ABC123"
									autoComplete="off"
								/>
							</Field>
							<Button type="submit" fullWidth disabled={joinCode.length < 4}>
								{t('spy.menu.enter')}
							</Button>
						</form>
					)}

					{view === 'public' && (
						<div className="space-y-4">
							<Button type="button" variant="ghost" size="sm" onClick={() => setView('menu')}>
								<GameIcon name="arrow-left" size={15} />
								{t('common.back')}
							</Button>
							{loadingPublic ? (
								<div className="space-y-2">
									<Skeleton className="h-16 w-full" />
									<Skeleton className="h-16 w-full" />
								</div>
							) : error ? (
								<ErrorState message={error} onRetry={() => void loadPublicRooms()} />
							) : publicRooms.length === 0 ? (
								<EmptyState
									icon={<GameIcon name="map" size={28} />}
									title={t('spy.menu.noPublic')}
									description={t('spy.menu.noPublicHint')}
									actionLabel={t('spy.menu.create')}
									onAction={() => setView('create')}
								/>
							) : (
								<ul className="space-y-2">
									{publicRooms.map((r) => (
										<li key={r.code}>
											<button
												type="button"
												onClick={() => {
													const normalized = normalizePlayerName(name);
													const err = validateName();
													if (err) {
														setNameError(err);
														return;
													}
													hapticLight();
													storeRecentPlayerName(normalized);
													router.push(
														`${routes.spyFallRoom(r.code)}?name=${encodeURIComponent(normalized)}`,
													);
												}}
												className="w-full rounded-xl border border-border bg-surface p-4 text-left transition hover:bg-surface-hover"
											>
												<div className="font-semibold text-foreground">{r.name}</div>
												<div className="mt-1 text-xs text-muted">
													{r.playerCount}/{r.maxPlayers} ·{' '}
													{r.topic === 'any' ? t('spy.lobby.topicAny') : t(`spy.topics.${r.topic}`)}
												</div>
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</Card>

				<nav className="mx-auto mt-7 flex max-w-xl items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs uppercase tracking-[0.14em]">
					<Link
						href={routes.spyFallGuide}
						className="inline-flex items-center gap-2 text-accent hover:underline"
					>
						<GameIcon name="book" size={15} />
						{t('spy.menu.guide')}
					</Link>
					<span className="font-mono text-[10px] text-muted">{t('spy.menu.guestNote')}</span>
				</nav>
			</div>
		</div>
	);
}
