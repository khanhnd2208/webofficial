'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import HostPinPad from '@/components/mafia/HostPinPad';
import MafiaScreen from '@/components/mafia/MafiaScreen';
import { MafiaGameProvider, useMafiaGame } from '@/components/mafia/hooks/useMafiaGame';
import AssignAnimation from '@/components/mafia/screens/AssignAnimation';
import HomeScreen from '@/components/mafia/screens/HomeScreen';
import HostOverview from '@/components/mafia/screens/HostOverview';
import PinSetupScreen from '@/components/mafia/screens/PinSetupScreen';
import PlayerSetupScreen from '@/components/mafia/screens/PlayerSetupScreen';
import {
	DistributionCompleteScreen,
	HandoffScreen,
	HiddenRoleScreen,
	PlayerIdentityConfirm,
	PlayerRevealScreen,
} from '@/components/mafia/screens/PlayerFlowScreens';
import ReadyScreen from '@/components/mafia/screens/ReadyScreen';
import ReviewScreen from '@/components/mafia/screens/ReviewScreen';
import RoleSelectScreen from '@/components/mafia/screens/RoleSelectScreen';
import SeatOrderScreen from '@/components/mafia/screens/SeatOrderScreen';
import { HOST_AUTO_LOCK_MS } from '@/config/mafiaGame';
import { Spinner } from '@/components/ui';

const PLAYER_MODE_STATUSES = new Set([
	'PLAYER_HANDOFF',
	'PLAYER_CONFIRM',
	'PLAYER_REVEAL',
	'PLAYER_CONFIRM_MEMORY',
	'DISTRIBUTION_COMPLETE',
]);

function MafiaGameRouter() {
	const t = useT();
	const {
		game,
		isHydrated,
		verifyHostPin,
		lockHostMode,
		pinError,
		clearPinError,
		showAssignAnimation,
		updateGame,
	} = useMafiaGame();
	const [showPinPad, setShowPinPad] = useState(false);
	const [pinPadMode, setPinPadMode] = useState<'unlock' | 'exit'>('unlock');
	const [hostUnlocked, setHostUnlocked] = useState(false);
	const prevStatusRef = useRef(game.status);

	useEffect(() => {
		if (game.status === 'HOST_MODE' && prevStatusRef.current !== 'HOST_MODE') {
			setHostUnlocked(false);
		}
		prevStatusRef.current = game.status;
	}, [game.status]);

	const isPlayerMode = PLAYER_MODE_STATUSES.has(game.status);
	const isPinLocked =
		game.pinLockedUntil !== null && new Date(game.pinLockedUntil) > new Date();

	useEffect(() => {
		if (game.status !== 'HOST_MODE' || !hostUnlocked) return;
		const reset = () => {
			clearTimeout((window as unknown as { _mafiaLock?: ReturnType<typeof setTimeout> })._mafiaLock);
			(window as unknown as { _mafiaLock?: ReturnType<typeof setTimeout> })._mafiaLock = setTimeout(
				() => {
					setHostUnlocked(false);
					lockHostMode();
				},
				HOST_AUTO_LOCK_MS,
			);
		};
		reset();
		window.addEventListener('pointerdown', reset);
		return () => {
			window.removeEventListener('pointerdown', reset);
			clearTimeout((window as unknown as { _mafiaLock?: ReturnType<typeof setTimeout> })._mafiaLock);
		};
	}, [game.status, hostUnlocked, lockHostMode]);

	useEffect(() => {
		const handleVisibility = () => {
			if (document.hidden) {
				if (game.status === 'HOST_MODE') {
					setHostUnlocked(false);
					lockHostMode();
				}
				if (game.status === 'PLAYER_REVEAL') {
					updateGame({ status: 'PLAYER_CONFIRM' });
				}
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	}, [game.status, lockHostMode, updateGame]);

	useEffect(() => {
		if (!isPlayerMode) return;
		const pushState = () => window.history.pushState({ mafia: true }, '');
		pushState();
		const handlePop = (e: PopStateEvent) => {
			e.preventDefault();
			pushState();
			setPinPadMode('exit');
			setShowPinPad(true);
		};
		window.addEventListener('popstate', handlePop);
		return () => window.removeEventListener('popstate', handlePop);
	}, [isPlayerMode]);

	const handlePinSubmit = useCallback(
		async (pin: string) => {
			const ok = await verifyHostPin(pin);
			if (ok) {
				setShowPinPad(false);
				setHostUnlocked(true);
				clearPinError();
				if (pinPadMode === 'exit') {
					updateGame({ status: 'HOST_MODE' });
				}
				return true;
			}
			return false;
		},
		[verifyHostPin, clearPinError, pinPadMode, updateGame],
	);

	if (!isHydrated) {
		return (
			<MafiaScreen center>
				<Spinner />
			</MafiaScreen>
		);
	}

	if (showAssignAnimation) {
		return <AssignAnimation />;
	}

	if (showPinPad || (game.status === 'HOST_MODE' && !hostUnlocked)) {
		return (
			<MafiaScreen center>
				<HostPinPad
					onSubmit={handlePinSubmit}
					onCancel={
						showPinPad
							? () => {
									setShowPinPad(false);
									clearPinError();
								}
							: undefined
					}
					error={pinError ? t(pinError) : null}
					locked={isPinLocked}
				/>
			</MafiaScreen>
		);
	}

	switch (game.status) {
		case 'HOME':
			return <HomeScreen />;
		case 'SETUP_PLAYERS':
			return <PlayerSetupScreen />;
		case 'SETUP_ORDER':
			return <SeatOrderScreen />;
		case 'SETUP_ROLES':
			return <RoleSelectScreen />;
		case 'SETUP_PIN':
			return <PinSetupScreen />;
		case 'READY_TO_ASSIGN':
			return <ReviewScreen />;
		case 'ROLES_ASSIGNED':
			return <ReadyScreen />;
		case 'HOST_MODE':
			return <HostOverview />;
		case 'PLAYER_HANDOFF':
			return <HandoffScreen />;
		case 'PLAYER_CONFIRM':
			return <PlayerIdentityConfirm />;
		case 'PLAYER_REVEAL':
			return <PlayerRevealScreen />;
		case 'PLAYER_CONFIRM_MEMORY':
			return <HiddenRoleScreen />;
		case 'DISTRIBUTION_COMPLETE':
			return <DistributionCompleteScreen />;
		case 'CANCELLED':
		default:
			return <HomeScreen />;
	}
}

export default function MafiaGameClient() {
	return (
		<MafiaGameProvider>
			<MafiaGameRouter />
		</MafiaGameProvider>
	);
}
