import {
	backToLobby,
	deal,
	markViewed,
	setRoleCounts,
} from '@/features/werewolf/services/werewolfService';
import type { TestCommand } from './types';

/** Use the same lobby guards and settings validation in admin test rooms. */
export async function applyWerewolfCommand(
	code: string,
	hostToken: string,
	controlledToken: string,
	command: TestCommand,
	random: () => number,
) {
	if (command.kind === 'start') await deal(code, hostToken, random);
	if (command.kind === 'viewed') await markViewed(code, controlledToken);
	if (command.kind === 'lobby') await backToLobby(code, hostToken);
	if (command.kind === 'roles')
		await setRoleCounts(code, hostToken, command.roleCounts, command.cardDeck);
}
