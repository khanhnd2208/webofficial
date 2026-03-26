// ────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config — toiladuykhanh.com
//
// Usage (on VPS):
//   pm2 start ecosystem.config.js      # First start
//   deploy-webofficial                 # Standard deploy (git pull + build + restart)
//
// Secrets: kept ONLY in /var/www/webofficial/.env.local (not committed)
// This file is safe to commit — no secrets hardcoded here.
// ────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

// Parse .env.local into an object (supports KEY=VALUE and KEY="VALUE")
function loadEnvLocal(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
      const match = line.match(/^\s*([^#\s][^=]*?)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (match) acc[match[1].trim()] = match[2].trim();
      return acc;
    }, {});
}

const envLocal = loadEnvLocal(path.join(__dirname, '.env.local'));

module.exports = {
  apps: [
    {
      // ── App identity ──────────────────────────────────────────
      name: 'nextjs-app',
      cwd: '/var/www/webofficial',

      // ── Start command ─────────────────────────────────────────
      script: 'npm',
      args: 'start',

      // ── Process settings ──────────────────────────────────────
      instances: 1,            // Single instance (sufficient for current traffic)
      exec_mode: 'fork',       // Fork mode (cluster mode requires custom server)
      autorestart: true,       // Auto-restart on crash
      watch: false,            // Do NOT watch files (we deploy manually)
      max_memory_restart: '1G', // Restart if memory exceeds 1GB

      // ── Logging ───────────────────────────────────────────────
      error_file: '/root/.pm2/logs/nextjs-app-error.log',
      out_file: '/root/.pm2/logs/nextjs-app-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── Environment ───────────────────────────────────────────
      // Merges .env.local (loaded above) with fixed production values.
      // NODE_ENV and PORT override anything in .env.local.
      env: {
        ...envLocal,
        NODE_ENV: 'production',
        PORT: '4000',
      },
    },
  ],
};
