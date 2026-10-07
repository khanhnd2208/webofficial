'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageToggle from '@/features/board-game-shared/components/i18n/LanguageToggle';
import { routes } from '@/config/routes';
import { useLocale } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { resolveErrorMessage } from '@/features/board-game-shared/lib/i18n/tLocale';
import SpyGameClient from '@/features/spy-fall/components/spy/SpyGameClient';
import CheeseThiefRoomClient from '@/features/cheese-thief/components/CheeseThiefRoomClient';
import WerewolfRoomClient from '@/features/werewolf/components/WerewolfRoomClient';
import { stopTableAudio, unlockTableAudio } from '@/features/cheese-thief/lib/narration';
import { TestRoomContext } from './context';
import {
	publishTestRoom,
	readAdminTestRoom,
	sendAdminTestCommand,
	subscribeTestRoom,
	testCommandPending,
	testRequest,
} from './clientApi';
import type { CreateTestRoomInput, TestCommand, TestGame, TestRoomEnvelope } from './types';

const games: { id: TestGame; name: string }[] = [
	{ id: 'spy-fall', name: 'Spy Fall' },
	{ id: 'ma-soi', name: 'Ma Sói' },
	{ id: 'cheese-thief', name: 'Cheese Thief' },
];
const field = 'min-h-11 min-w-0 rounded-lg border border-hairline bg-canvas px-3';

export default function TestRoomClient({
	initialGame,
	initialCode,
}: {
	initialGame?: string;
	initialCode?: string;
}) {
	const router = useRouter();
	const { locale, t } = useLocale();
	const label = (key: string) => t(`testRoom.${key}`);
	const [game, setGame] = useState<TestGame>(
		games.some((g) => g.id === initialGame) ? (initialGame as TestGame) : 'spy-fall',
	);
	const [hostName, setHostName] = useState('Admin');
	const [playerCount, setPlayerCount] = useState(6);
	const [spyCount, setSpyCount] = useState<1 | 2 | 3>(1);
	const [startingSeat, setStartingSeat] = useState<'host' | 'player'>('host');
	const [scapegoat, setScapegoat] = useState(false);
	const [seed, setSeed] = useState('');
	const [room, setRoom] = useState<TestRoomEnvelope | null>(null);
	const [inspection, setInspection] = useState<unknown>(null);
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [collapsed, setCollapsed] = useState(false);

	const reportError = useCallback(
		(cause: unknown) => {
			const code = cause instanceof Error ? cause.message : '';
			setError(
				code === 'TEST_STATE_CONFLICT' ? t('testRoom.conflict') : resolveErrorMessage(locale, code),
			);
		},
		[locale, t],
	);

	useEffect(() => subscribeTestRoom(setRoom), []);
	useEffect(() => {
		if (initialCode && games.some((g) => g.id === initialGame))
			void readAdminTestRoom(initialGame as TestGame, initialCode).catch(reportError);
	}, [initialCode, initialGame, reportError]);

	const roomGame = room?.game;
	const roomCode = room?.state.code;
	const running = room?.running;
	useEffect(() => {
		if (!roomGame || !roomCode) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout>;
		async function poll() {
			try {
				if (!document.hidden && !testCommandPending(roomGame!, roomCode!)) {
					if (running) await sendAdminTestCommand(roomGame!, roomCode!, { kind: 'tick' });
					else await readAdminTestRoom(roomGame!, roomCode!);
				}
			} catch (cause) {
				reportError(cause);
			} finally {
				if (!cancelled) timer = setTimeout(() => void poll(), running ? 400 : 1500);
			}
		}
		timer = setTimeout(() => void poll(), 400);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [roomGame, roomCode, running, reportError]);

	async function create(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError('');
		if (game === 'cheese-thief') unlockTableAudio();
		try {
			const input: CreateTestRoomInput = {
				game,
				hostName,
				locale,
				playerCount,
				seed,
				spyCount,
				startingSeat,
				scapegoat: playerCount >= 6 && scapegoat,
			};
			const result = await testRequest<TestRoomEnvelope>('/api/admin/board-game/test-rooms', {
				method: 'POST',
				body: JSON.stringify(input),
			});
			publishTestRoom(result);
			router.replace(`${routes.boardGameTest}?game=${game}&code=${result.state.code}`);
		} catch (cause) {
			reportError(cause);
		} finally {
			setBusy(false);
		}
	}
	async function send(command: TestCommand) {
		if (!room) return;
		setBusy(true);
		setError('');
		setInspection(null);
		if (['run', 'skip-time', 'reset', 'close', 'set-seat'].includes(command.kind)) stopTableAudio();
		try {
			const result = await sendAdminTestCommand<TestRoomEnvelope | { closed: boolean }>(
				room.game,
				room.state.code,
				command,
			);
			if ('closed' in result) {
				setRoom(null);
				router.replace(routes.boardGameTest);
			}
		} catch (cause) {
			reportError(cause);
		} finally {
			setBusy(false);
		}
	}
	async function inspect() {
		if (!room) return;
		try {
			setInspection(
				inspection
					? null
					: await testRequest(
							`/api/admin/board-game/test-rooms/${room.game}/${room.state.code}/inspect`,
						),
			);
		} catch (cause) {
			reportError(cause);
		}
	}
	const action = (key: string, command: TestCommand) => (
		<button
			type="button"
			disabled={busy}
			onClick={() => void send(command)}
			className="min-h-10 rounded-full border border-hairline px-3 text-xs disabled:opacity-50"
		>
			{label(key)}
		</button>
	);

	if (room) {
		const players = room.state.players as unknown as {
			id?: string;
			token?: string;
			name: string;
			isHost?: boolean;
		}[];
		const seatOptions = players.map((p) => ({
			id: room.game === 'ma-soi' ? p.token! : p.isHost ? 'admin' : p.id!,
			name: p.name,
		}));
		const key = `${room.game}-${room.state.code}-${room.controlledSeatId}`;
		return (
			<TestRoomContext.Provider value={room}>
				<div className="min-h-svh bg-canvas text-ink">
					<aside
						aria-label={label('title')}
						className="sticky top-0 z-[200] max-h-[55svh] overflow-auto border-b border-hairline bg-paper px-3 py-2"
					>
						<div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
							<strong className="mr-auto text-xs">{label('private')}</strong>
							<LanguageToggle />
							<button
								type="button"
								className="min-h-10 text-xs"
								onClick={() => setCollapsed(!collapsed)}
							>
								{label(collapsed ? 'expand' : 'collapse')}
							</button>
							<label className="flex items-center gap-2 text-xs">
								{label('seat')}
								<select
									aria-label={label('seat')}
									value={room.controlledSeatId}
									disabled={busy}
									onChange={(e) => void send({ kind: 'set-seat', seatId: e.target.value })}
									className={`${field} max-w-40`}
								>
									{room.game === 'ma-soi' && <option value="host">{label('host')}</option>}
									{seatOptions.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</label>
							{action(room.running ? 'pause' : 'run', { kind: 'run', running: !room.running })}
							{!collapsed && (
								<>
									{action('step', { kind: 'step' })}
									{room.game === 'cheese-thief' &&
										room.state.phase === 'night' &&
										action('skip', { kind: 'skip-time' })}
									{action('newGame', { kind: 'reset', sameSeed: false })}
									{action('close', { kind: 'close' })}
									<details className="w-full text-xs">
										<summary className="cursor-pointer py-2">{label('advanced')}</summary>
										<div className="flex flex-wrap gap-2">
											{action('sameSeed', { kind: 'reset', sameSeed: true })}
											<button
												type="button"
												className="min-h-10 rounded-full border px-3"
												onClick={() => void inspect()}
											>
												{label('secrets')}
											</button>
											<span className="break-all p-2">Seed: {room.seed}</span>
										</div>
										{inspection !== null && (
											<pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-canvas p-3">
												{JSON.stringify(inspection, null, 2)}
											</pre>
										)}
									</details>
								</>
							)}
						</div>
						<p className="mx-auto max-w-5xl text-xs text-ink-secondary">
							{label(room.running ? 'running' : 'paused')} · {room.state.phase} · {room.state.code}
						</p>
						{error && (
							<p role="alert" className="mx-auto max-w-5xl text-sm text-red-700">
								{error}
							</p>
						)}
					</aside>
					{room.game === 'spy-fall' && <SpyGameClient key={key} code={room.state.code} adminTest />}
					{room.game === 'cheese-thief' && (
						<CheeseThiefRoomClient key={key} code={room.state.code} adminTest />
					)}
					{room.game === 'ma-soi' && (
						<WerewolfRoomClient key={key} code={room.state.code} adminTest />
					)}
				</div>
			</TestRoomContext.Provider>
		);
	}
	return (
		<main className="min-h-svh bg-canvas px-5 py-10 text-ink">
			<div className="mx-auto max-w-3xl">
				<Link href={routes.boardGame}>← Board Game</Link>
				<h1 className="mt-8 font-display text-3xl">{label('title')}</h1>
				<p className="mt-3 text-ink-secondary">{label('subtitle')}</p>
				<form
					onSubmit={(e) => void create(e)}
					className="mt-8 grid gap-5 rounded-2xl border border-hairline bg-paper p-5 sm:grid-cols-2"
				>
					<label className="grid gap-2 text-sm">
						Game
						<select
							value={game}
							onChange={(e) => setGame(e.target.value as TestGame)}
							className={field}
						>
							{games.map((g) => (
								<option key={g.id} value={g.id}>
									{g.name}
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-2 text-sm">
						{label('name')}
						<input
							required
							maxLength={24}
							value={hostName}
							onChange={(e) => setHostName(e.target.value)}
							className={field}
						/>
					</label>
					<label className="grid gap-2 text-sm">
						{label('players')}
						<input
							type="number"
							min={game === 'ma-soi' ? 5 : 4}
							max={game === 'ma-soi' ? 20 : 12}
							value={playerCount}
							onChange={(e) => setPlayerCount(Number(e.target.value))}
							className={field}
						/>
					</label>
					<label className="grid gap-2 text-sm">
						{label('startingSeat')}
						<select
							value={startingSeat}
							onChange={(e) => setStartingSeat(e.target.value as 'host' | 'player')}
							className={field}
						>
							<option value="host">{label('host')}</option>
							<option value="player">{label('player')}</option>
						</select>
					</label>
					{game === 'spy-fall' && (
						<label className="grid gap-2 text-sm">
							{label('spies')}
							<select
								value={spyCount}
								onChange={(e) => setSpyCount(Number(e.target.value) as 1 | 2 | 3)}
								className={field}
							>
								{[1, 2, 3].map((n) => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
						</label>
					)}
					{game === 'cheese-thief' && playerCount >= 6 && (
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={scapegoat}
								onChange={(e) => setScapegoat(e.target.checked)}
							/>
							Scapegoat
						</label>
					)}
					<label className="grid gap-2 text-sm">
						{label('seed')}
						<input
							value={seed}
							onChange={(e) => setSeed(e.target.value)}
							maxLength={64}
							className={field}
						/>
					</label>
					{error && (
						<p role="alert" className="text-sm text-red-700 sm:col-span-2">
							{error}
						</p>
					)}
					<button
						disabled={busy}
						className="min-h-12 rounded-full bg-ink px-5 text-sm text-paper disabled:opacity-50 sm:col-span-2"
					>
						{label('create')}
					</button>
				</form>
			</div>
		</main>
	);
}
