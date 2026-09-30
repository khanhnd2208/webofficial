// Isolated browser-test server. Production databases are never used.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';
import { spawn } from 'node:child_process';
config({ path: '.env.test', quiet: true });
config({ path: '.env.local', quiet: true });
if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required');
const mongo = await MongoMemoryServer.create();
const child = spawn(
	process.execPath,
	['node_modules/next/dist/bin/next', 'dev', '-p', process.env.BOARD_GAME_TEST_PORT ?? '3107'],
	{
		stdio: 'inherit',
		env: {
			...process.env,
			MONGODB_URI: mongo.getUri(),
			DATABASE_URL: process.env.TEST_DATABASE_URL,
		},
	},
);
let stopping = false;
async function stop() {
	if (stopping) return;
	stopping = true;
	child.kill('SIGTERM');
	await mongo.stop();
}
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
child.on('exit', async (code) => {
	await stop();
	process.exit(code ?? 0);
});
