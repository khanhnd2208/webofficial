import { describe, expect, it } from 'vitest';

import {
	createNightMarketRoom,
	getNightMarketState,
	performNightMarketAction,
} from '@/services/nightMarketService';

describe('nightMarketService integration', () => {
	it('starts every supported solo table size from 3 to 6 seats', async () => {
		for (let botCount = 2; botCount <= 5; botCount += 1) {
			const created = await createNightMarketRoom({ name: `Solo ${botCount}`, hostName: 'Solo' });
			let state = await performNightMarketAction(created.state.code, { token: created.playerToken, actionId: `ready-${botCount}`, expectedVersion: created.state.version, action: { type: 'ready', ready: true } });
			for (let index = 0; index < botCount; index += 1) {
				state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: `bot-${botCount}-${index}`, expectedVersion: state.version, action: { type: 'add-bot', profile: index % 2 ? 'daring' : 'cautious' } });
			}
			state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: `start-${botCount}`, expectedVersion: state.version, action: { type: 'start' } });
			expect(state.players).toHaveLength(botCount + 1);
			expect(state.totalRounds).toBe(botCount + 1);
		}
	});

	it('creates a private room, adds bots, and starts with one human', async () => {
		const created = await createNightMarketRoom({ name: 'Moon market', hostName: 'Host' });
		let state = created.state;
		state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: 'ready', expectedVersion: state.version, action: { type: 'ready', ready: true } });
		state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: 'bot-1', expectedVersion: state.version, action: { type: 'add-bot', profile: 'cautious' } });
		state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: 'bot-2', expectedVersion: state.version, action: { type: 'add-bot', profile: 'daring' } });
		state = await performNightMarketAction(state.code, { token: created.playerToken, actionId: 'start', expectedVersion: state.version, action: { type: 'start' } });
		expect(state.phase).toBe('round-intro');
		expect(state.players).toHaveLength(3);
		expect(state.self?.hand).toHaveLength(6);
		expect(state.players.every((publicPlayer) => !('hand' in publicPlayer))).toBe(true);
	});

	it('deduplicates a repeated action id', async () => {
		const created = await createNightMarketRoom({ name: 'Dedup', hostName: 'Host' });
		const input = { token: created.playerToken, actionId: 'same-command', expectedVersion: created.state.version, action: { type: 'add-bot' as const, profile: 'balanced' as const } };
		const first = await performNightMarketAction(created.state.code, input);
		const second = await performNightMarketAction(created.state.code, input);
		expect(first.players).toHaveLength(2);
		expect(second.players).toHaveLength(2);
	});

	it('rejects stale versions and scopes state to its viewer', async () => {
		const created = await createNightMarketRoom({ name: 'Versions', hostName: 'Host' });
		await performNightMarketAction(created.state.code, { token: created.playerToken, actionId: 'change', expectedVersion: 0, action: { type: 'add-bot' } });
		await expect(performNightMarketAction(created.state.code, { token: created.playerToken, actionId: 'stale', expectedVersion: 0, action: { type: 'add-bot' } })).rejects.toThrow(/VERSION_CONFLICT/);
		const spectator = await getNightMarketState(created.state.code, null);
		expect(spectator.self).toBeNull();
	});
});
