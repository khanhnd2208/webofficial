'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import PrefsToggleGroup from '@/components/i18n/PrefsToggleGroup';
import { useT } from '@/components/i18n/LocaleProvider';
import {
	Button,
	Card,
	EmptyState,
	ErrorState,
	Field,
	Input,
	Skeleton,
} from '@/components/ui';
import { SPY_MAX_PLAYERS } from '@/config/spyGame';
import { withBasePath } from '@/lib/basePath';
import { postSpyAction } from '@/lib/spy/api';
import { getRecentPlayerName, storePlayerToken, storeRecentPlayerName } from '@/lib/spy/clientToken';
import { hapticLight } from '@/lib/haptics';
import { isValidPlayerName, normalizePlayerName } from '@/lib/spy/playerName';
import { playConfirm, playTap } from '@/lib/sounds';
import PlayerNameInput from '@/components/spy/PlayerNameInput';
import type { PublicRoomListItemDTO, RoomStateDTO } from '@/types/spyGame';

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
					difficulty: 'mixed',
					isPublic: false,
				},
			);
			storePlayerToken(data.state.code, data.playerToken);
			storeRecentPlayerName(normalized);
			playConfirm();
			router.push(
				`/games/spy/room/${data.state.code}?name=${encodeURIComponent(normalized)}`,
			);
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
		router.push(`/games/spy/room/${code}?name=${encodeURIComponent(normalized)}`);
	}

	return (
		<div className="relative min-h-screen bg-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgb(196,75,40,0.08),transparent_70%)]" />
			<div className="relative mx-auto max-w-md px-4 py-8 pb-[max(4rem,env(safe-area-inset-bottom))] lg:max-w-lg">
				<div className="mb-6 flex justify-end">
					<PrefsToggleGroup />
				</div>

				<header className="text-center">
					<p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Covert Expedition</p>
					<p className="mt-3 text-5xl" aria-hidden>
						🕵️
					</p>
					<h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink">
						{t('spy.menu.title')}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">{t('spy.menu.subtitle')}</p>
				</header>

				<Card elevated className="mt-8 space-y-4">
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
								{t('spy.menu.publicRooms')}
							</Button>
						</form>
					)}

					{view === 'create' && (
						<form onSubmit={handleCreate} className="space-y-4">
							<Button type="button" variant="ghost" size="sm" onClick={() => setView('menu')}>
								← {t('common.back')}
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
								← {t('common.back')}
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
								← {t('common.back')}
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
									icon="🛫"
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
														`/games/spy/room/${r.code}?name=${encodeURIComponent(normalized)}`,
													);
												}}
												className="w-full rounded-xl border border-border bg-surface p-4 text-left transition hover:bg-surface-hover"
											>
												<div className="font-semibold text-foreground">{r.name}</div>
												<div className="mt-1 text-xs text-muted">
													{r.playerCount}/{r.maxPlayers} ·{' '}
													{r.topic === 'any'
														? t('spy.lobby.topicAny')
														: t(`spy.topics.${r.topic}`)}{' '}
													· {t(`spy.difficulty.${r.difficulty}`)}
												</div>
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</Card>

				<nav className="mt-6 flex flex-col items-center gap-2 text-sm">
					<Link href="/?tab=boardgames" className="text-muted hover:text-foreground">
						{t('spy.menu.backHub')}
					</Link>
					<Link href="/games/spy/guide" className="text-accent hover:underline">
						{t('spy.menu.guide')}
					</Link>
				</nav>
			</div>
		</div>
	);
}
