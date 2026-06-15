#!/usr/bin/env bash
# Deploy my-teaching-platform to VPS via SSH + rsync (no GitHub Actions required).
#
# Prerequisites (one-time):
#   1. SSH key auth to VPS — see scripts/setup-vps-ssh.sh
#   2. ~/.ssh/config Host alias "webofficial-vps"
#
# Usage:
#   ./scripts/deploy-vps.sh          # full deploy
#   ./scripts/deploy-vps.sh --check  # test SSH only
#
# Secrets stay on VPS in /var/www/webofficial/.env.local — never synced.

set -euo pipefail

VPS_HOST="${VPS_HOST:-webofficial-vps}"
VPS_DIR="${VPS_DIR:-/var/www/webofficial}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

log() { printf '\n▸ %s\n' "$*"; }

if [[ "${1:-}" == "--check" ]]; then
	ssh -o ConnectTimeout=10 "$VPS_HOST" "echo 'SSH OK —' \$(hostname) && pm2 status nextjs-app --no-color | head -4"
	exit 0
fi

log "Syncing code → $VPS_HOST:$VPS_DIR"
rsync -avz \
	--exclude node_modules \
	--exclude .next \
	--exclude .git \
	--exclude '.env*' \
	--exclude 'public/uploads' \
	--exclude 'public/music/uploads' \
	--exclude '.DS_Store' \
	--exclude 'coverage' \
	-e ssh \
	"$ROOT/" "$VPS_HOST:$VPS_DIR/"

log "Building & reloading on VPS"
ssh "$VPS_HOST" bash -s <<REMOTE
set -e
cd "$VPS_DIR"
echo "📦 npm install..."
npm install --include=dev
echo "🔧 prisma..."
npx prisma generate
npx prisma migrate deploy
echo "🏗️  build..."
npm run build
echo "♻️  pm2 reload..."
pm2 reload nextjs-app --update-env
echo "✅ Done"
pm2 status nextjs-app --no-color | head -5
REMOTE

log "Deploy complete — https://toiladuykhanh.com"
