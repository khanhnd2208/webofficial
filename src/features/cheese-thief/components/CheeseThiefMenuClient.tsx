'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import { CHEESE_MAX_PLAYERS } from '@/features/cheese-thief/config/cheeseThief';
import { postCheeseAction } from '@/features/cheese-thief/lib/api';
import { storePlayerToken } from '@/features/cheese-thief/lib/clientToken';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/spy-fall/components/spy/PlayerNameInput';
import { Button, Field, Input } from '@/features/spy-fall/components/ui';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';
import CheeseThiefArt from '@/features/cheese-thief/components/CheeseThiefArt';
import { CheeseRulesButton } from '@/features/cheese-thief/components/CheeseRulesGuide';
import { getRecentPlayerName, storeRecentPlayerName } from '@/features/spy-fall/lib/spy/clientToken';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';

type View = 'menu' | 'create' | 'join';

export default function CheeseThiefMenuClient() {
	const t = useT();
	const router = useRouter();
	const [view, setView] = useState<View>('menu');
	const [name, setName] = useState('');
	const [roomName, setRoomName] = useState('');
	const [joinCode, setJoinCode] = useState('');
	const [scapegoat, setScapegoat] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setName(getRecentPlayerName() ?? '');
	}, []);

	function validatedName(): string | null {
		const normalized = normalizePlayerName(name);
		if (!isValidPlayerName(normalized)) {
			setError(t('cheese.join.missing'));
			return null;
		}
		setError(null);
		return normalized;
	}

	async function handleCreate(event: React.FormEvent) {
		event.preventDefault();
		const hostName = validatedName();
		if (!hostName) return;
		setBusy(true);
		try {
			const data = await postCheeseAction<{ state: RoomStateDTO; playerToken: string }>('/api/cheese-thief/rooms', {
				name: roomName.trim() || t('cheese.menu.defaultRoom', { name: hostName }),
				hostName,
				scapegoat,
				maxPlayers: CHEESE_MAX_PLAYERS,
				isPublic: true,
			});
			storePlayerToken(data.state.code, data.playerToken);
			storeRecentPlayerName(hostName);
			router.push(routes.cheeseThiefRoom(data.state.code));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : t('common.unknownError'));
		} finally {
			setBusy(false);
		}
	}

	function handleJoin(event: React.FormEvent) {
		event.preventDefault();
		const hostName = validatedName();
		if (!hostName) return;
		const code = joinCode.trim().toUpperCase();
		if (!code) return;
		storeRecentPlayerName(hostName);
		router.push(`${routes.cheeseThiefRoom(code)}?name=${encodeURIComponent(hostName)}`);
	}

	return (
		<div className="game-theme game-theme-cheese">
			<div className="relative mx-auto max-w-3xl px-4 py-5 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
				<div className="mb-5 flex items-center justify-between gap-4">
					<Link
						href={routes.boardGame}
						className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase hover:text-foreground"
					>
						<GameIcon name="arrow-left" size={15} />
						Board Game
					</Link>
					<PrefsToggleGroup />
				</div>

				<header className="game-theme-hero rounded-[1.25rem]">
					<Image
						src="/board-game/cheese-thief/cover.webp"
						alt={t('cheese.menu.posterAlt')}
						fill
						priority
						className="game-theme-hero-image"
						sizes="(max-width: 768px) 100vw, 720px"
					/>
					<div className="relative z-10 flex min-h-72 flex-col justify-end p-6 sm:min-h-80 sm:p-8">
						<div className="absolute top-5 right-5 rounded-full border border-white/15 bg-black/20 p-2 backdrop-blur-sm sm:top-7 sm:right-7">
							<CheeseThiefArt scene="mouse" size={60} />
						</div>
						<p className="game-theme-kicker">{t('cheese.menu.kicker')}</p>
						<h1 className="mt-3 font-display text-5xl font-medium tracking-tight">{t('cheese.menu.title')}</h1>
						<p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/80 sm:text-base">{t('cheese.menu.tagline')}</p>
					</div>
				</header>

				<div className="mt-6">
					{view === 'menu' && (
						<form
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								if (!validatedName()) return;
								setRoomName(t('cheese.menu.defaultRoom', { name: normalizePlayerName(name) }));
								setView('create');
							}}
						>
							<Field label={t('cheese.menu.yourName')} htmlFor="cheese-name" error={error}>
								<PlayerNameInput
									id="cheese-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									maxLength={24}
								/>
							</Field>
							<Button fullWidth type="submit">
								{t('cheese.menu.create')}
							</Button>
							<Button fullWidth variant="secondary" onClick={() => setView('join')}>
								{t('cheese.menu.join')}
							</Button>
							<CheeseRulesButton className="block w-full py-2 text-center text-sm font-medium underline underline-offset-4" />
							<p className="text-center font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">
								{t('cheese.menu.players')} · {t('cheese.menu.noAccount')}
							</p>
						</form>
					)}

					{view === 'create' && (
						<form className="space-y-4" onSubmit={handleCreate}>
							<Field label={t('cheese.menu.roomName')} htmlFor="cheese-room">
								<Input id="cheese-room" value={roomName} onChange={(event) => setRoomName(event.target.value)} />
							</Field>
							<label className="flex items-start gap-3 rounded-2xl border border-border px-4 py-3">
								<input
									type="checkbox"
									className="mt-1 h-5 w-5"
									checked={scapegoat}
									onChange={(event) => setScapegoat(event.target.checked)}
								/>
								<span>
									<span className="block text-sm font-medium">{t('cheese.menu.scapegoat')}</span>
									<span className="mt-1 block text-sm text-muted">{t('cheese.menu.scapegoatHint')}</span>
								</span>
							</label>
							{error && <p className="text-sm text-danger">{error}</p>}
							<Button fullWidth type="submit" loading={busy}>
								{t('cheese.menu.open')}
							</Button>
							<Button fullWidth variant="ghost" onClick={() => setView('menu')}>
								{t('cheese.menu.back')}
							</Button>
						</form>
					)}

					{view === 'join' && (
						<form className="space-y-4" onSubmit={handleJoin}>
							<Field label={t('cheese.menu.yourName')} htmlFor="cheese-join-name">
								<PlayerNameInput
									id="cheese-join-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									maxLength={24}
								/>
							</Field>
							<Field label={t('cheese.menu.code')} htmlFor="cheese-code">
								<Input
									id="cheese-code"
									value={joinCode}
									autoCapitalize="characters"
									onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
								/>
							</Field>
							{error && <p className="text-sm text-danger">{error}</p>}
							<Button fullWidth type="submit">
								{t('cheese.menu.enter')}
							</Button>
							<Button fullWidth variant="ghost" onClick={() => setView('menu')}>
								{t('cheese.menu.back')}
							</Button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
