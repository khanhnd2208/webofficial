// ────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config — toiladuykhanh.com
//
// Usage (on VPS):
//   pm2 startOrReload current/ecosystem.config.js --only nextjs-app --update-env
//   npm run deploy:vps                 # Canonical staged release deploy
//
// Secrets: sourced from /var/www/webofficial/.env.local and copied with mode
// 0600 into each immutable release. This file has no hardcoded secrets.
// ────────────────────────────────────────────────────────────────
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse: parseDotenv } = require('dotenv');

const deployRoot = process.env.WEBOFFICIAL_DEPLOY_ROOT || '/var/www/webofficial';
const currentDir = path.join(deployRoot, 'current');
const appDir = fs.existsSync(currentDir) ? currentDir : deployRoot;
const appName = process.env.PM2_APP_NAME || 'nextjs-app';
const livePort = process.env.PM2_LIVE_PORT || '4000';
// PM2 runs as the `deploy` user; keep logs in that user's PM2 home.
const logDir = path.join(process.env.PM2_HOME || path.join(os.homedir(), '.pm2'), 'logs');

// Parse the release-local environment snapshot. The canonical deploy copies it
// from the protected shared .env.local with mode 0600 before every build.
function loadEnvLocal(filePath) {
	if (!fs.existsSync(filePath)) return {};
	return parseDotenv(fs.readFileSync(filePath));
}

const envLocal = loadEnvLocal(path.join(appDir, '.env.local'));

// The deployment ID must equal the one baked into the build. Builds record it
// in .next/DEPLOYMENT_ID; older releases were built with their directory name.
function recordedDeploymentId(dir) {
	try {
		return fs.readFileSync(path.join(dir, '.next/DEPLOYMENT_ID'), 'utf8').trim() || undefined;
	} catch {
		return undefined;
	}
}

module.exports = {
	apps: [
		{
			// ── App identity ──────────────────────────────────────────
			name: appName,
			cwd: appDir,

			// ── Start command ─────────────────────────────────────────
			script: path.join(appDir, 'node_modules/.bin/next'),
			args: `start -H 127.0.0.1 -p ${livePort}`,

			// ── Process settings ──────────────────────────────────────
			instances: 1, // Single instance (sufficient for current traffic)
			exec_mode: 'fork', // Fork mode (cluster mode requires custom server)
			autorestart: true, // Auto-restart on crash
			watch: false, // Do NOT watch files (we deploy manually)
			max_memory_restart: '2G', // Next.js + Prisma + rich-text decks can exceed 1GB during saves
			kill_timeout: 30000, // Let Next.js drain in-flight work on SIGTERM

			// ── Logging ───────────────────────────────────────────────
			error_file: path.join(logDir, `${appName}-error.log`),
			out_file: path.join(logDir, `${appName}-out.log`),
			merge_logs: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

			// ── Environment ───────────────────────────────────────────
			// Merges .env.local (loaded above) with fixed production values.
			// NODE_ENV and PORT override anything in .env.local.
			env: {
				...envLocal,
				NODE_ENV: 'production',
				PORT: livePort,
				NEXT_DEPLOYMENT_ID:
					process.env.NEXT_DEPLOYMENT_ID ||
					envLocal.NEXT_DEPLOYMENT_ID ||
					recordedDeploymentId(appDir) ||
					path.basename(fs.realpathSync(appDir)),
			},
		},
	],
};
