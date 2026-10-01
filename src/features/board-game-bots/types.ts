export const LIVE_BOT_GAMES = ['spy-fall', 'cheese-thief', 'ma-soi'] as const;
export type LiveBotGame = (typeof LIVE_BOT_GAMES)[number];

export function isLiveBotGame(value: string): value is LiveBotGame {
	return (LIVE_BOT_GAMES as readonly string[]).includes(value);
}
