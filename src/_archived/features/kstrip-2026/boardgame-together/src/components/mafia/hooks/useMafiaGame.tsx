'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getSuggestedRoleSet, MAX_PLAYERS, MIN_PLAYERS } from '@/config/mafiaGame';
import {
	assignRoles,
	findDuplicateNames,
	getNextPendingPlayer,
	getPlayerById,
	getViewedCount,
	sortPlayersBySeat,
} from '@/lib/mafia/assignment';
import { generateSalt, hashPin, verifyPin } from '@/lib/mafia/pin';
import { clearGame, createNewGameId, loadGame, saveGame } from '@/lib/mafia/storage';
import type {
	MafiaGame,
	PassDirection,
	Player,
	RoleSelection,
	ViewStatus,
} from '@/types/mafiaGame';
import { MAX_PIN_ATTEMPTS, PIN_LOCKOUT_MS } from '@/config/mafiaGame';

function createEmptyGame(): MafiaGame {
	return {
		id: createNewGameId(),
		version: 1,
		status: 'HOME',
		createdAt: new Date().toISOString(),
		hostPinHash: null,
		hostPinSalt: null,
		passDirection: 'clockwise',
		players: [],
		roleSelections: [],
		currentPlayerId: null,
		distributionCompleted: false,
		pinAttempts: 0,
		pinLockedUntil: null,
	};
}

function generatePlayerId(): string {
	return `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface MafiaGameContextValue {
	game: MafiaGame;
	isHydrated: boolean;
	viewedCount: number;
	duplicateNames: string[];
	updateGame: (patch: Partial<MafiaGame>) => void;
	startNewGame: () => void;
	continueGame: () => void;
	cancelGame: () => void;

	// Setup actions
	setPlayers: (names: string[]) => void;
	reorderPlayers: (orderedIds: string[]) => void;
	setPassDirection: (dir: PassDirection) => void;
	setRoleSelections: (selections: RoleSelection[]) => void;
	applySuggestedRoles: () => void;
	setHostPin: (pin: string) => Promise<void>;
	assignRolesRandomly: () => void;

	// Host actions
	requestHostMode: () => void;
	verifyHostPin: (pin: string) => Promise<boolean>;
	lockHostMode: () => void;
	redealAllRoles: () => void;
	allowReplay: (playerId: string) => void;
	reorderPendingPlayers: (orderedIds: string[]) => void;

	// Player flow
	startHandoff: () => void;
	confirmIdentity: () => void;
	denyIdentity: () => void;
	confirmRemembered: () => void;
	requestReplay: () => void;

	pinError: string | null;
	clearPinError: () => void;
	showAssignAnimation: boolean;
	setShowAssignAnimation: (v: boolean) => void;
}

const MafiaGameContext = createContext<MafiaGameContextValue | null>(null);

export function MafiaGameProvider({ children }: { children: React.ReactNode }) {
	const [game, setGame] = useState<MafiaGame>(createEmptyGame);
	const [isHydrated, setIsHydrated] = useState(false);
	const [pinError, setPinError] = useState<string | null>(null);
	const [showAssignAnimation, setShowAssignAnimation] = useState(false);
	const gameRef = useRef(game);
	gameRef.current = game;

	const persist = useCallback((next: MafiaGame) => {
		setGame(next);
		if (next.status === 'HOME' || next.status === 'CANCELLED') {
			clearGame();
		} else {
			saveGame(next);
		}
	}, []);

	const updateGame = useCallback(
		(patch: Partial<MafiaGame>) => {
			persist({ ...gameRef.current, ...patch });
		},
		[persist],
	);

	useEffect(() => {
		const saved = loadGame();
		if (saved) {
			if (saved.status === 'PLAYER_REVEAL') {
				saved.status = 'PLAYER_CONFIRM';
			}
			setGame(saved);
		} else {
			setGame(createEmptyGame());
		}
		setIsHydrated(true);
	}, []);

	const startNewGame = useCallback(() => {
		const next = createEmptyGame();
		next.status = 'SETUP_PLAYERS';
		persist(next);
	}, [persist]);

	const continueGame = useCallback(() => {
		const saved = loadGame();
		if (!saved) return;
		if (saved.distributionCompleted) {
			persist({ ...saved, status: 'DISTRIBUTION_COMPLETE' });
		} else if (saved.status === 'ROLES_ASSIGNED' || getViewedCount(saved.players) === 0) {
			persist({ ...saved, status: 'ROLES_ASSIGNED' });
		} else {
			const next = getNextPendingPlayer(saved.players);
			persist({
				...saved,
				status: 'PLAYER_HANDOFF',
				currentPlayerId: next?.id ?? saved.currentPlayerId,
			});
		}
	}, [persist]);

	const cancelGame = useCallback(() => {
		clearGame();
		const next = createEmptyGame();
		next.status = 'HOME';
		setGame(next);
	}, []);

	const setPlayers = useCallback(
		(names: string[]) => {
			const players: Player[] = names
				.map((name, i) => ({
					id: generatePlayerId(),
					name: name.trim(),
					seatOrder: i,
					roleId: null,
					viewStatus: 'PENDING' as ViewStatus,
					privateInformation: null,
				}))
				.filter((p) => p.name.length > 0);
			persist({
				...gameRef.current,
				players,
				roleSelections: getSuggestedRoleSet(players.length),
				status: 'SETUP_ORDER',
			});
		},
		[persist],
	);

	const reorderPlayers = useCallback(
		(orderedIds: string[]) => {
			const map = new Map(gameRef.current.players.map((p) => [p.id, p]));
			const players = orderedIds
				.map((id, i) => {
					const p = map.get(id);
					return p ? { ...p, seatOrder: i } : null;
				})
				.filter((p): p is Player => p !== null);
			persist({ ...gameRef.current, players });
		},
		[persist],
	);

	const setPassDirection = useCallback(
		(dir: PassDirection) => {
			persist({ ...gameRef.current, passDirection: dir });
		},
		[persist],
	);

	const setRoleSelections = useCallback(
		(selections: RoleSelection[]) => {
			persist({ ...gameRef.current, roleSelections: selections });
		},
		[persist],
	);

	const applySuggestedRoles = useCallback(() => {
		const count = gameRef.current.players.length;
		persist({ ...gameRef.current, roleSelections: getSuggestedRoleSet(count) });
	}, [persist]);

	const setHostPin = useCallback(
		async (pin: string) => {
			const salt = generateSalt();
			const hash = await hashPin(pin, salt);
			persist({
				...gameRef.current,
				hostPinHash: hash,
				hostPinSalt: salt,
				status: 'READY_TO_ASSIGN',
			});
		},
		[persist],
	);

	const assignRolesRandomly = useCallback(() => {
		setShowAssignAnimation(true);
		const assigned = assignRoles({
			players: gameRef.current.players,
			roleSelections: gameRef.current.roleSelections,
		});
		persist({
			...gameRef.current,
			players: assigned,
			status: 'ROLES_ASSIGNED',
			distributionCompleted: false,
			currentPlayerId: null,
		});
	}, [persist]);

	const isPinLocked = useCallback(() => {
		const g = gameRef.current;
		if (!g.pinLockedUntil) return false;
		return new Date(g.pinLockedUntil) > new Date();
	}, []);

	const requestHostMode = useCallback(() => {
		updateGame({ status: 'HOST_MODE' });
	}, [updateGame]);

	const verifyHostPin = useCallback(
		async (pin: string): Promise<boolean> => {
			const g = gameRef.current;
			if (isPinLocked()) {
				setPinError('mafia.pinPad.lockout');
				return false;
			}
			if (!g.hostPinHash || !g.hostPinSalt) return false;
			const ok = await verifyPin(pin, g.hostPinSalt, g.hostPinHash);
			if (ok) {
				setPinError(null);
				persist({ ...g, pinAttempts: 0, pinLockedUntil: null, status: 'HOST_MODE' });
				return true;
			}
			const attempts = g.pinAttempts + 1;
			if (attempts >= MAX_PIN_ATTEMPTS) {
				persist({
					...g,
					pinAttempts: 0,
					pinLockedUntil: new Date(Date.now() + PIN_LOCKOUT_MS).toISOString(),
				});
				setPinError('mafia.pinPad.lockout');
			} else {
				persist({ ...g, pinAttempts: attempts });
				setPinError('mafia.pinPad.incorrect');
			}
			return false;
		},
		[isPinLocked, persist],
	);

	const lockHostMode = useCallback(() => {
		const g = gameRef.current;
		if (g.distributionCompleted) {
			persist({ ...g, status: 'DISTRIBUTION_COMPLETE' });
		} else if (getViewedCount(g.players) > 0) {
			const next = getNextPendingPlayer(g.players);
			persist({
				...g,
				status: next ? 'PLAYER_HANDOFF' : 'ROLES_ASSIGNED',
				currentPlayerId: next?.id ?? null,
			});
		} else {
			persist({ ...g, status: 'ROLES_ASSIGNED' });
		}
	}, [persist]);

	const redealAllRoles = useCallback(() => {
		const assigned = assignRoles({
			players: gameRef.current.players.map((p) => ({
				...p,
				roleId: null,
				viewStatus: 'PENDING' as ViewStatus,
				privateInformation: null,
			})),
			roleSelections: gameRef.current.roleSelections,
		});
		persist({
			...gameRef.current,
			players: assigned,
			status: 'ROLES_ASSIGNED',
			distributionCompleted: false,
			currentPlayerId: null,
		});
	}, [persist]);

	const allowReplay = useCallback(
		(playerId: string) => {
			const players = gameRef.current.players.map((p) =>
				p.id === playerId ? { ...p, viewStatus: 'ACTIVE' as ViewStatus } : p,
			);
			persist({
				...gameRef.current,
				players,
				currentPlayerId: playerId,
				status: 'PLAYER_CONFIRM',
			});
		},
		[persist],
	);

	const reorderPendingPlayers = useCallback(
		(orderedIds: string[]) => {
			const g = gameRef.current;
			const viewed = sortPlayersBySeat(g.players.filter((p) => p.viewStatus === 'VIEWED'));
			const map = new Map(g.players.map((p) => [p.id, p]));
			const pending = orderedIds
				.map((id, i) => {
					const p = map.get(id);
					return p ? { ...p, seatOrder: viewed.length + i } : null;
				})
				.filter((p): p is Player => p !== null);
			const all = [...viewed.map((p, i) => ({ ...p, seatOrder: i })), ...pending];
			persist({ ...g, players: all });
		},
		[persist],
	);

	const startHandoff = useCallback(() => {
		const next = getNextPendingPlayer(gameRef.current.players);
		if (!next) return;
		persist({
			...gameRef.current,
			status: 'PLAYER_HANDOFF',
			currentPlayerId: next.id,
		});
	}, [persist]);

	const confirmIdentity = useCallback(() => {
		const g = gameRef.current;
		const players = g.players.map((p) =>
			p.id === g.currentPlayerId ? { ...p, viewStatus: 'ACTIVE' as ViewStatus } : p,
		);
		persist({ ...g, players, status: 'PLAYER_REVEAL' });
	}, [persist]);

	const denyIdentity = useCallback(() => {
		// Player must return phone to host — no self-service name change
	}, []);

	const confirmRemembered = useCallback(() => {
		const g = gameRef.current;
		const players = g.players.map((p) =>
			p.id === g.currentPlayerId ? { ...p, viewStatus: 'VIEWED' as ViewStatus } : p,
		);
		const pending = getNextPendingPlayer(players);
		if (!pending) {
			persist({
				...g,
				players,
				distributionCompleted: true,
				status: 'DISTRIBUTION_COMPLETE',
				currentPlayerId: null,
			});
		} else {
			persist({
				...g,
				players,
				status: 'PLAYER_HANDOFF',
				currentPlayerId: pending.id,
			});
		}
	}, [persist]);

	const requestReplay = useCallback(() => {
		persist({ ...gameRef.current, status: 'PLAYER_REVEAL' });
	}, [persist]);

	const clearPinError = useCallback(() => setPinError(null), []);

	const value = useMemo<MafiaGameContextValue>(
		() => ({
			game,
			isHydrated,
			viewedCount: getViewedCount(game.players),
			duplicateNames: findDuplicateNames(game.players),
			updateGame,
			startNewGame,
			continueGame,
			cancelGame,
			setPlayers,
			reorderPlayers,
			setPassDirection,
			setRoleSelections,
			applySuggestedRoles,
			setHostPin,
			assignRolesRandomly,
			requestHostMode,
			verifyHostPin,
			lockHostMode,
			redealAllRoles,
			allowReplay,
			reorderPendingPlayers,
			startHandoff,
			confirmIdentity,
			denyIdentity,
			confirmRemembered,
			requestReplay,
			pinError,
			clearPinError,
			showAssignAnimation,
			setShowAssignAnimation,
		}),
		[
			game,
			isHydrated,
			updateGame,
			startNewGame,
			continueGame,
			cancelGame,
			setPlayers,
			reorderPlayers,
			setPassDirection,
			setRoleSelections,
			applySuggestedRoles,
			setHostPin,
			assignRolesRandomly,
			requestHostMode,
			verifyHostPin,
			lockHostMode,
			redealAllRoles,
			allowReplay,
			reorderPendingPlayers,
			startHandoff,
			confirmIdentity,
			denyIdentity,
			confirmRemembered,
			requestReplay,
			pinError,
			clearPinError,
			showAssignAnimation,
		],
	);

	return <MafiaGameContext.Provider value={value}>{children}</MafiaGameContext.Provider>;
}

export function useMafiaGame() {
	const ctx = useContext(MafiaGameContext);
	if (!ctx) throw new Error('useMafiaGame must be used within MafiaGameProvider');
	return ctx;
}

export function useCurrentPlayer(): Player | undefined {
	const { game } = useMafiaGame();
	return game.currentPlayerId ? getPlayerById(game.players, game.currentPlayerId) : undefined;
}

export { MIN_PLAYERS, MAX_PLAYERS, sortPlayersBySeat };
