// ────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config — toiladuykhanh.com
//
// Usage:
//   pm2 start ecosystem.config.js      # Start / reload
//   pm2 restart nextjs-app             # Restart
//   pm2 stop nextjs-app                # Stop
//   pm2 logs nextjs-app                # View logs
//
// After changes: pm2 restart nextjs-app --update-env
// ────────────────────────────────────────────────────────────────
module.exports = {
  apps: [
    {
      // ── App identity ──────────────────────────────────────────
      name: 'nextjs-app',
      cwd: '/var/www/webofficial',

      // ── Start command ─────────────────────────────────────────
      // Equivalent to: cd /var/www/webofficial && npm start
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
      // Other env vars (AUTH_SECRET, MONGODB_URI, etc.) are loaded
      // from /var/www/webofficial/.env.local by Next.js automatically.
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
