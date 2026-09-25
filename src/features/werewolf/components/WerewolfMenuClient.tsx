'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import PrefsToggleGroup from '@/features/spy-fall/components/i18n/PrefsToggleGroup';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import PlayerNameInput from '@/features/spy-fall/components/spy/PlayerNameInput';
import { Button, Card, Field } from '@/features/spy-fall/components/ui';
import { hapticLight } from '@/features/spy-fall/lib/haptics';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import { postWerewolfAction } from '@/features/werewolf/lib/api';
import {
	getRecentPlayerName,
	storePlayerToken,
	storeRecentPlayerName,
} from '@/features/werewolf/lib/clientToken';
import type { RoomStateDTO } from '@/features/werewolf/types';

type View = 'menu' | 'create' | 'join';

export default function WerewolfMenuClient() {
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
			const data = await postWerewolfAction<{ state: RoomStateDTO; hostToken: string }>('/api/ma-soi/rooms', {
				hostName,
			});
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
		<div className="relative min-h-screen bg-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(120,30,40,0.12),transparent_70%)]" />
			<div className="relative mx-auto max-w-md px-4 py-8 pb-[max(4rem,env(safe-area-inset-bottom))]">
				<div className="mb-6 flex items-center justify-between">
					<Link href={routes.boardGame} className="text-sm text-muted-foreground hover:text-ink">
						{t('mafia.menu.backToHub')}
					</Link>
					<PrefsToggleGroup />
				</div>
				<header className="text-center">
					<p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{t('mafia.menu.eyebrow')}</p>
					<p className="mt-3 text-5xl" aria-hidden>
						🐺
					</p>
					<h1 className="font-display mt-2 text-3xl font-bold text-ink">{t('mafia.menu.title')}</h1>
					<p className="mt-2 text-sm text-muted-foreground">{t('mafia.menu.subtitle')}</p>
				</header>

				<Card elevated className="mt-8 space-y-4">
					{view === 'menu' ? (
						<div className="space-y-3">
							<Button type="button" fullWidth onClick={() => setView('create')}>
								{t('mafia.menu.create')}
							</Button>
							<Button type="button" fullWidth variant="secondary" onClick={() => setView('join')}>
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
								{t('mafia.menu.create')}
							</Button>
							<Button type="button" fullWidth variant="ghost" onClick={() => setView('menu')}>
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
								{t('mafia.menu.join')}
							</Button>
							<Button type="button" fullWidth variant="ghost" onClick={() => setView('menu')}>
								{t('mafia.menu.back')}
							</Button>
						</form>
					) : null}
				</Card>
			</div>
		</div>
	);
}
