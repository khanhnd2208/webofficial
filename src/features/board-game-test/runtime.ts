import { AsyncLocalStorage } from 'node:async_hooks';

// Ordinary rooms use wall time and system randomness. Test commands supply a
// frozen clock and seeded generator without changing the shared game rules.
const environment = new AsyncLocalStorage<{ now: number; random: () => number }>();
export const gameNow = () => new Date(environment.getStore()?.now ?? Date.now());
export const gameRandom = () => environment.getStore()?.random() ?? Math.random();
export const withTestEnvironment = <T>(now: number, random: () => number, action: () => T): T =>
	environment.run({ now, random }, action);
