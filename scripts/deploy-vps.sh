#!/usr/bin/env bash
# Canonical release-based production deploy for toiladuykhanh.com.
#
# Usage:
#   ./scripts/deploy-vps.sh
#   ./scripts/deploy-vps.sh --check
#   ./scripts/deploy-vps.sh --dry-run

set -Eeuo pipefail

VPS_HOST="${VPS_HOST:-webofficial-vps}"
VPS_PORT="${VPS_PORT:-22}"
VPS_DIR="${VPS_DIR:-/var/www/webofficial}"
DEPLOY_KEY="${DEPLOY_KEY:-}"
DEPLOY_RELEASE_ID="${DEPLOY_RELEASE_ID:-}"
PUBLIC_URL="${PUBLIC_URL:-https://toiladuykhanh.com}"
PM2_APP_NAME="${PM2_APP_NAME:-nextjs-app}"
LIVE_PORT="${LIVE_PORT:-4000}"
CANDIDATE_PORT="${CANDIDATE_PORT:-4001}"
DB_BACKUP_COMMAND="${DB_BACKUP_COMMAND:-/opt/scripts/backup-databases.sh}"
EXPECT_PUBLIC_LEARNING_LOCKS="${EXPECT_PUBLIC_LEARNING_LOCKS:-true}"

SOURCE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="deploy"
LOCAL_EXPORT_DIR=""

log() { printf '\n▸ %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

usage() {
	cat <<'EOF'
Usage: scripts/deploy-vps.sh [--check|--dry-run|--help]

  no option   Build a staged release and promote it after health checks.
  --check     Read-only SSH, PM2, migration, and health diagnostics.
  --dry-run   Export the clean Git commit and preview rsync only.

Optional environment variables:
  VPS_HOST, VPS_PORT, VPS_DIR, DEPLOY_KEY, DEPLOY_RELEASE_ID, PUBLIC_URL,
  PM2_APP_NAME, LIVE_PORT, CANDIDATE_PORT, DB_BACKUP_COMMAND,
  EXPECT_PUBLIC_LEARNING_LOCKS
EOF
}

case "${1:-}" in
	"") ;;
	--check) MODE="check" ;;
	--dry-run) MODE="dry-run" ;;
	--help|-h) usage; exit 0 ;;
	*) usage >&2; die "Unknown option: $1" ;;
esac

[[ "$VPS_PORT" =~ ^[0-9]+$ ]] || die "VPS_PORT must be numeric"
[[ "$LIVE_PORT" =~ ^[0-9]+$ ]] || die "LIVE_PORT must be numeric"
[[ "$CANDIDATE_PORT" =~ ^[0-9]+$ ]] || die "CANDIDATE_PORT must be numeric"
((VPS_PORT >= 1 && VPS_PORT <= 65535)) || die "VPS_PORT must be between 1 and 65535"
((LIVE_PORT >= 1 && LIVE_PORT <= 65535)) || die "LIVE_PORT must be between 1 and 65535"
((CANDIDATE_PORT >= 1 && CANDIDATE_PORT <= 65535)) || die "CANDIDATE_PORT must be between 1 and 65535"
[[ "$LIVE_PORT" != "$CANDIDATE_PORT" ]] || die "Candidate and live ports must differ"
[[ "$VPS_HOST" =~ ^([A-Za-z_][A-Za-z0-9._-]*@)?[A-Za-z0-9.-]+$ ]] || die "Unsafe VPS_HOST"
[[ "$VPS_DIR" =~ ^/[A-Za-z0-9._/-]+$ && "$VPS_DIR" != "/" ]] || die "Unsafe VPS_DIR: $VPS_DIR"
[[ "$VPS_DIR" != *"//"* && "$VPS_DIR" != *"/../"* && "$VPS_DIR" != */.. ]] || die "Unsafe VPS_DIR traversal: $VPS_DIR"
[[ "$PUBLIC_URL" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "PUBLIC_URL must be an HTTPS origin without a path"
[[ "$PM2_APP_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || die "Unsafe PM2_APP_NAME"
[[ "$DB_BACKUP_COMMAND" =~ ^/[A-Za-z0-9._/-]+$ ]] || die "DB_BACKUP_COMMAND must be an absolute executable path"
[[ "$EXPECT_PUBLIC_LEARNING_LOCKS" == "true" || "$EXPECT_PUBLIC_LEARNING_LOCKS" == "false" ]] || die "EXPECT_PUBLIC_LEARNING_LOCKS must be true or false"

SSH_ARGS=(-o BatchMode=yes -o ConnectTimeout=10 -p "$VPS_PORT")
if [[ -n "$DEPLOY_KEY" ]]; then
	[[ -f "$DEPLOY_KEY" ]] || die "DEPLOY_KEY does not exist: $DEPLOY_KEY"
	SSH_ARGS+=(-i "$DEPLOY_KEY")
fi

[[ "$DEPLOY_KEY" != *[[:space:]]* ]] || die "DEPLOY_KEY path must not contain whitespace"
RSYNC_SSH="ssh -o BatchMode=yes -o ConnectTimeout=10 -p $VPS_PORT"
if [[ -n "$DEPLOY_KEY" ]]; then
	RSYNC_SSH+=" -i $DEPLOY_KEY"
fi

run_ssh() {
	# Arguments are validated before this helper; intentional client-side expansion
	# constructs the fixed remote bash/flock command and its positional arguments.
	# shellcheck disable=SC2029
	ssh "${SSH_ARGS[@]}" "$VPS_HOST" "$@"
}

if [[ "$MODE" == "check" ]]; then
	log "Checking SSH and production status (read-only)"
	run_ssh "bash -s -- '$VPS_DIR' '$PM2_APP_NAME' '$LIVE_PORT'" <<'REMOTE_CHECK'
set -Eeuo pipefail
deploy_root="$1"
app_name="$2"
live_port="$3"

printf 'host='; hostname
printf 'utc='; date -u +%FT%TZ
printf 'node='; node --version
printf 'nginx='; systemctl is-active nginx
printf 'postgresql='; systemctl is-active postgresql
printf 'mongodb='; systemctl is-active mongod
pm2 status "$app_name" --no-color | sed -n '1,8p'
test -f "$deploy_root/.env.local"
printf 'env_mode='; stat -c '%a' "$deploy_root/.env.local"
if [[ -L "$deploy_root/current" ]]; then
	app_dir="$deploy_root/current"
else
	app_dir="$deploy_root"
fi
(
	cd "$app_dir"
	./node_modules/.bin/prisma migrate status
)
curl --fail --silent --show-error --max-time 10 \
	"http://127.0.0.1:${live_port}/api/health/live" >/dev/null
curl --fail --silent --show-error --max-time 10 \
	"http://127.0.0.1:${live_port}/api/health/ready" >/dev/null
printf 'health=live,ready\n'
if [[ -L "$deploy_root/current" ]]; then
	printf 'current='; readlink "$deploy_root/current"
else
	printf 'current=legacy-root\n'
fi
REMOTE_CHECK
	exit 0
fi

command -v git >/dev/null || die "git is required"
command -v rsync >/dev/null || die "rsync is required"
command -v tar >/dev/null || die "tar is required"

cd "$SOURCE_ROOT"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Source is not a Git worktree"
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || die "Refusing to deploy a dirty worktree; commit or remove every change first"

SOURCE_SHA="$(git rev-parse HEAD)"
SOURCE_SHA_SHORT="$(git rev-parse --short=12 HEAD)"
if [[ -z "$DEPLOY_RELEASE_ID" ]]; then
	DEPLOY_RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${SOURCE_SHA_SHORT}"
fi
[[ "$DEPLOY_RELEASE_ID" =~ ^[A-Za-z0-9._-]+$ ]] || die "Unsafe DEPLOY_RELEASE_ID"

LOCAL_EXPORT_DIR="$(mktemp -d)"
cleanup_local() {
	if [[ -n "$LOCAL_EXPORT_DIR" && -d "$LOCAL_EXPORT_DIR" ]]; then
		rm -rf -- "$LOCAL_EXPORT_DIR"
	fi
}
trap cleanup_local EXIT

log "Exporting clean commit $SOURCE_SHA_SHORT"
git archive --format=tar "$SOURCE_SHA" | tar -xf - -C "$LOCAL_EXPORT_DIR"

RSYNC_EXCLUDES=(
	--exclude node_modules/
	--exclude .next/
	--exclude .git/
	--exclude '.env*'
	--exclude public/uploads/
	--exclude public/music/uploads/
	--exclude backups/
	--exclude theory/
	--exclude .venv/
	--exclude '*.tsbuildinfo'
	--exclude .DS_Store
	--exclude coverage/
	--exclude playwright-report/
	--exclude test-results/
	--exclude '.tmp-*'
	--exclude .cursor/
)

if [[ "$MODE" == "dry-run" ]]; then
	DRY_RUN_TARGET="$VPS_DIR/.deploy-dry-run-$DEPLOY_RELEASE_ID/"
	log "Previewing clean release sync to $VPS_HOST:$DRY_RUN_TARGET"
	rsync -avzn --delete --delete-delay --itemize-changes --no-owner --no-group \
		"${RSYNC_EXCLUDES[@]}" \
		-e "$RSYNC_SSH" \
		"$LOCAL_EXPORT_DIR/" "$VPS_HOST:$DRY_RUN_TARGET"
	log "Dry-run complete; no remote files were created or changed"
	exit 0
fi

RELEASES_DIR="$VPS_DIR/releases"
REMOTE_RELEASE_DIR="$RELEASES_DIR/$DEPLOY_RELEASE_ID"

log "Preparing empty release $VPS_HOST:$REMOTE_RELEASE_DIR"
run_ssh "bash -s -- '$VPS_DIR' '$DEPLOY_RELEASE_ID'" <<'REMOTE_PREPARE'
set -Eeuo pipefail
deploy_root="$1"
release_id="$2"
release_dir="$deploy_root/releases/$release_id"

test -d "$deploy_root"
test -f "$deploy_root/.env.local"
install -d -m 755 "$deploy_root/releases"
if [[ -e "$release_dir" || -L "$release_dir" ]]; then
	echo "Release already exists: $release_dir" >&2
	exit 1
fi
install -d -m 755 "$release_dir"
REMOTE_PREPARE

log "Syncing immutable source export with deletion enabled"
rsync -avz --delete --delete-delay --itemize-changes --no-owner --no-group \
	"${RSYNC_EXCLUDES[@]}" \
	-e "$RSYNC_SSH" \
	"$LOCAL_EXPORT_DIR/" "$VPS_HOST:$REMOTE_RELEASE_DIR/"

log "Building, migrating, validating, and promoting release"
run_ssh "flock -n '$VPS_DIR/.deploy.lock' bash -s -- '$VPS_DIR' '$DEPLOY_RELEASE_ID' '$SOURCE_SHA' '$PM2_APP_NAME' '$LIVE_PORT' '$CANDIDATE_PORT' '$PUBLIC_URL' '$DB_BACKUP_COMMAND' '$EXPECT_PUBLIC_LEARNING_LOCKS'" <<'REMOTE_DEPLOY'
set -Eeuo pipefail

DEPLOY_ROOT="$1"
RELEASE_ID="$2"
SOURCE_SHA="$3"
APP_NAME="$4"
LIVE_PORT="$5"
CANDIDATE_PORT="$6"
PUBLIC_URL="$7"
BACKUP_COMMAND="$8"
EXPECT_LOCKS="$9"

RELEASE_DIR="$DEPLOY_ROOT/releases/$RELEASE_ID"
CURRENT_LINK="$DEPLOY_ROOT/current"
CANDIDATE_NAME="${APP_NAME}-candidate-${RELEASE_ID}"
SWAPPED=0
PREVIOUS_TARGET=""
BACKUP_COMPLETED="no"
ROLLBACK_SMOKE_SAFE=0

atomic_current_link() {
	local target="$1"
	local temporary_link="$DEPLOY_ROOT/.current-${RELEASE_ID}-$$"
	rm -f -- "$temporary_link"
	ln -s "$target" "$temporary_link"
	mv -Tf "$temporary_link" "$CURRENT_LINK"
}

wait_for_ready() {
	local port="$1"
	local attempts="${2:-30}"
	local attempt
	for attempt in $(seq 1 "$attempts"); do
		if curl --fail --silent --show-error --max-time 5 \
			"http://127.0.0.1:${port}/api/health/ready" >/dev/null; then
			return 0
		fi
		sleep 2
	done
	return 1
}

expect_http_status() {
	local base_url="$1"
	local path="$2"
	local expected="$3"
	local actual
	actual="$(curl --silent --show-error --max-time 10 -o /dev/null -w '%{http_code}' "${base_url}${path}")"
	if [[ "$actual" != "$expected" ]]; then
		echo "Unexpected HTTP status for $path: expected $expected, got $actual" >&2
		return 1
	fi
}

expect_redirect_location() {
	local base_url="$1"
	local path="$2"
	local expected="$3"
	local headers
	headers="$(curl --silent --show-error --max-time 10 -D - -o /dev/null "${base_url}${path}")"
	printf '%s' "$headers" | node -e '
		const expected = process.argv[1];
		const path = process.argv[2];
		let raw = "";
		process.stdin.on("data", (chunk) => { raw += chunk; });
		process.stdin.on("end", () => {
			const status = (raw.match(/^HTTP\/[\d.]+ (\d+)/im) || [])[1];
			const locLine = raw.split(/\r?\n/).find((line) => /^location:/i.test(line)) || "";
			let location = locLine.replace(/^location:\s*/i, "").trim();
			try {
				const parsed = new URL(location, "http://smoke.invalid");
				location = `${parsed.pathname}${parsed.search}`;
			} catch {
				process.stderr.write(`Could not parse Location for ${path}: ${location}\n`);
				process.exit(1);
			}
			if (status !== "307" && status !== "308") {
				process.stderr.write(`Unexpected HTTP status for ${path}: expected 307/308, got ${status || "empty"}\n`);
				process.exit(1);
			}
			if (location !== expected) {
				process.stderr.write(`Unexpected Location for ${path}: expected ${expected}, got ${location}\n`);
				process.exit(1);
			}
		});
	' "$expected" "$path"
}

expect_guest_store_api() {
	local base_url="$1"
	local body
	body="$(curl --silent --show-error --max-time 10 "${base_url}/api/vocab-sets/store?limit=5")"
	printf '%s' "$body" | node -e '
		let input = "";
		process.stdin.on("data", (chunk) => { input += chunk; });
		process.stdin.on("end", () => {
			let payload;
			try { payload = JSON.parse(input); } catch {
				process.stderr.write("Guest store API did not return JSON\n");
				process.exit(1);
			}
			const items = payload?.data?.items;
			if (payload?.ok !== true || !Array.isArray(items)) {
				process.stderr.write("Guest store API missing ok/items envelope\n");
				process.exit(1);
			}
			if (items.some((item) => item?.alreadyOwned !== false)) {
				process.stderr.write("Guest store API must mark every item alreadyOwned=false\n");
				process.exit(1);
			}
		});
	'
}

expect_store_post_unauthorized() {
	local base_url="$1"
	local actual
	actual="$(curl --silent --show-error --max-time 10 -o /dev/null -w '%{http_code}' \
		-X POST "${base_url}/api/vocab-sets/store" \
		-H 'Content-Type: application/json' \
		-d '{"vocabSetId":"smoke-unauthenticated"}')"
	if [[ "$actual" != "401" ]]; then
		echo "Unexpected HTTP status for POST /api/vocab-sets/store: expected 401, got $actual" >&2
		return 1
	fi
}

assert_application_smoke() {
	local base_url="$1"
	local api_body

	expect_http_status "$base_url" '/vocabulary/store' 404
	expect_guest_store_api "$base_url"
	expect_store_post_unauthorized "$base_url"
	expect_http_status "$base_url" '/lop/no-such-class-ever' 404
	expect_redirect_location "$base_url" '/admin/teaching?tab=cp' '/my-space/teaching?tab=cp'
	expect_redirect_location "$base_url" '/my-space/teaching?tab=cp' '/dang-nhap?from=%2Fmy-space%2Fteaching%3Ftab%3Dcp'
	expect_redirect_location "$base_url" '/messages' '/admin/tools/messages'
	expect_http_status "$base_url" '/my-space/active-recall' 200
	expect_http_status "$base_url" '/api/admin/active-recall' 401
	if [[ "$EXPECT_LOCKS" != "true" ]]; then
		return 0
	fi

	for locked_page in /my-space/tests /my-space/my-class /vocabulary /vocabulary/store; do
		expect_http_status "$base_url" "$locked_page" 404
	done
	for locked_api in /api/myspace-tests /api/my-class; do
		expect_http_status "$base_url" "$locked_api" 404
		api_body="$(curl --silent --show-error --max-time 10 "${base_url}${locked_api}")"
		printf '%s' "$api_body" | node -e '
			let input = "";
			process.stdin.on("data", (chunk) => { input += chunk; });
			process.stdin.on("end", () => {
				const payload = JSON.parse(input);
				if (payload.code !== "FEATURE_NOT_AVAILABLE") process.exit(1);
			});
		'
	done
}

pm2_process_uses_current_config() {
	pm2 jlist | node -e '
		const fs = require("fs");
		const path = require("path");
		const [appName, currentDir] = process.argv.slice(1);
		let input = "";
		process.stdin.on("data", (chunk) => { input += chunk; });
		process.stdin.on("end", () => {
			const apps = JSON.parse(input);
			const app = apps.find((candidate) => candidate.name === appName);
			if (!app) process.exit(1);
			const safeRealpath = (value) => {
				try { return fs.realpathSync(value); } catch { return value; }
			};
			const configuredExec = path.join(currentDir, "node_modules/.bin/next");
			const expectedCwds = new Set([currentDir, safeRealpath(currentDir)]);
			const expectedExecs = new Set([configuredExec, safeRealpath(configuredExec)]);
			if (!expectedCwds.has(app.pm2_env?.pm_cwd)) process.exit(1);
			if (!expectedExecs.has(app.pm2_env?.pm_exec_path)) process.exit(1);
		});
	' "$APP_NAME" "$CURRENT_LINK"
}

start_or_reload_live() {
	local deployment_id
	deployment_id="$(basename "$(readlink -f "$CURRENT_LINK")")"
	if pm2_process_uses_current_config; then
		PM2_APP_NAME="$APP_NAME" \
		PM2_LIVE_PORT="$LIVE_PORT" \
		WEBOFFICIAL_DEPLOY_ROOT="$DEPLOY_ROOT" \
		NEXT_DEPLOYMENT_ID="$deployment_id" \
			pm2 startOrReload "$CURRENT_LINK/ecosystem.config.js" \
				--only "$APP_NAME" --update-env
	else
		echo "PM2 command/cwd differs from the release-based config; replacing the managed process."
		pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
		PM2_APP_NAME="$APP_NAME" \
		PM2_LIVE_PORT="$LIVE_PORT" \
		WEBOFFICIAL_DEPLOY_ROOT="$DEPLOY_ROOT" \
		NEXT_DEPLOYMENT_ID="$deployment_id" \
			pm2 start "$CURRENT_LINK/ecosystem.config.js" \
				--only "$APP_NAME" --update-env
	fi
	pm2_process_uses_current_config || {
		echo "PM2 did not adopt the expected current-release command and cwd" >&2
		return 1
	}
}

on_exit() {
	local status=$?
	trap - EXIT
	set +e
	pm2 delete "$CANDIDATE_NAME" >/dev/null 2>&1 || true

	if [[ "$status" -ne 0 && "$SWAPPED" -eq 1 ]]; then
		if [[ "$ROLLBACK_SMOKE_SAFE" -eq 1 ]]; then
			echo "Promotion failed; restoring complete previous release: $PREVIOUS_TARGET" >&2
			atomic_current_link "$PREVIOUS_TARGET"
			if start_or_reload_live && wait_for_ready "$LIVE_PORT" 30; then
				pm2 save --force >/dev/null 2>&1 || true
				echo "Previous release is healthy again." >&2
			else
				echo "CRITICAL: automatic code rollback did not become ready." >&2
			fi
		else
			echo "CRITICAL: previous release failed the required application/lock smoke." >&2
			echo "Stopping the live PM2 process instead of reopening unfinished public features." >&2
			pm2 stop "$APP_NAME" >/dev/null 2>&1 || true
			pm2 save --force >/dev/null 2>&1 || true
		fi
	fi

	if [[ "$status" -ne 0 && "$BACKUP_COMPLETED" == "yes" ]]; then
		echo "The pre-migration database backup was retained by $BACKUP_COMMAND." >&2
		echo "Database restore is intentionally manual because it can discard newer writes." >&2
	fi
	exit "$status"
}
trap on_exit EXIT

[[ -d "$RELEASE_DIR" ]] || { echo "Missing staged release: $RELEASE_DIR" >&2; exit 1; }
[[ -f "$RELEASE_DIR/package-lock.json" ]] || { echo "Release has no package-lock.json" >&2; exit 1; }
[[ -f "$DEPLOY_ROOT/.env.local" ]] || { echo "Missing production .env.local" >&2; exit 1; }
[[ -x "$BACKUP_COMMAND" ]] || { echo "Backup command is unavailable: $BACKUP_COMMAND" >&2; exit 1; }

for command_name in node npm npx pm2 curl ss; do
	command -v "$command_name" >/dev/null || { echo "Missing command: $command_name" >&2; exit 1; }
done
if ss -ltnH | awk '{ print $4 }' | grep -Eq ":${CANDIDATE_PORT}$"; then
	echo "Candidate port is already in use: $CANDIDATE_PORT" >&2
	exit 1
fi

if [[ -L "$CURRENT_LINK" ]]; then
	PREVIOUS_TARGET="$(readlink "$CURRENT_LINK")"
	[[ "$PREVIOUS_TARGET" == "." || "$PREVIOUS_TARGET" =~ ^releases/[A-Za-z0-9._-]+$ ]] || {
		echo "Current symlink has an unsafe target: $PREVIOUS_TARGET" >&2
		exit 1
	}
	[[ -f "$CURRENT_LINK/ecosystem.config.js" && -d "$CURRENT_LINK/.next" ]] || {
		echo "Current release is not a complete rollback target: $PREVIOUS_TARGET" >&2
		exit 1
	}
elif [[ -e "$CURRENT_LINK" ]]; then
	echo "$CURRENT_LINK exists but is not a symlink" >&2
	exit 1
else
	# The untouched legacy root is the first release-based deploy's rollback.
	PREVIOUS_TARGET="."
	[[ -f "$DEPLOY_ROOT/ecosystem.config.js" && -d "$DEPLOY_ROOT/.next" ]] || {
		echo "Legacy application root is not a complete rollback target" >&2
		exit 1
	}
fi

chmod 600 "$DEPLOY_ROOT/.env.local"
install -m 600 "$DEPLOY_ROOT/.env.local" "$RELEASE_DIR/.env.local"

for required_key in \
	MONGODB_URI DATABASE_URL AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET \
	ADMIN_EMAIL ADMIN_SECRET; do
	if ! grep -Eq "^[[:space:]]*${required_key}=.+" "$RELEASE_DIR/.env.local"; then
		echo "Missing or empty production environment key: $required_key" >&2
		exit 1
	fi
done
if ! grep -Eq '^[[:space:]]*(AUTH_URL|NEXTAUTH_URL)=https://' "$RELEASE_DIR/.env.local"; then
	echo "AUTH_URL or NEXTAUTH_URL must be a non-empty HTTPS URL" >&2
	exit 1
fi
if ! grep -Eq '^[[:space:]]*TEACHING_GROUP_BOARD_ENABLED=(true|false)[[:space:]]*$' "$RELEASE_DIR/.env.local"; then
	echo "TEACHING_GROUP_BOARD_ENABLED must be explicitly true or false" >&2
	exit 1
fi
if [[ "$EXPECT_LOCKS" == "true" ]]; then
	for feature_flag in PUBLIC_TESTS_ENABLED PUBLIC_KNOWLEDGE_ENABLED; do
		if ! grep -Eq "^[[:space:]]*${feature_flag}=false[[:space:]]*$" "$RELEASE_DIR/.env.local"; then
			echo "$feature_flag must be explicitly false while public learning locks are expected" >&2
			exit 1
		fi
	done
fi

cat >"$RELEASE_DIR/.deploy-metadata" <<METADATA
release_id=$RELEASE_ID
source_sha=$SOURCE_SHA
previous_target=$PREVIOUS_TARGET
staged_at=$(date -u +%FT%TZ)
METADATA
chmod 644 "$RELEASE_DIR/.deploy-metadata"

cd "$RELEASE_DIR"
echo "Installing locked dependencies in $RELEASE_DIR"
HUSKY=0 npm ci --include=dev
node - "$RELEASE_DIR/.env.local" "$PUBLIC_URL" "$EXPECT_LOCKS" <<'NODE_ENV_CHECK'
const fs = require('fs');
const { parse } = require('dotenv');

const [envPath, publicUrl, expectLocks] = process.argv.slice(2);
const env = parse(fs.readFileSync(envPath));
const required = [
	'MONGODB_URI',
	'DATABASE_URL',
	'AUTH_SECRET',
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
	'ADMIN_EMAIL',
	'ADMIN_SECRET',
];
const missing = required.filter((key) => !env[key]?.trim());
if (missing.length > 0) {
	throw new Error(`Missing production environment keys: ${missing.join(', ')}`);
}
if (!env.MONGODB_URI.startsWith('mongodb')) throw new Error('MONGODB_URI must use a MongoDB scheme');
if (!env.DATABASE_URL.startsWith('postgresql://')) throw new Error('DATABASE_URL must use postgresql://');
if (env.AUTH_SECRET.trim().length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters');
const authUrl = env.AUTH_URL ?? env.NEXTAUTH_URL;
if (authUrl !== publicUrl) throw new Error(`AUTH_URL/NEXTAUTH_URL must equal ${publicUrl}`);
if (!['true', 'false'].includes(env.TEACHING_GROUP_BOARD_ENABLED)) {
	throw new Error('TEACHING_GROUP_BOARD_ENABLED must be explicitly true or false');
}
if (expectLocks === 'true') {
	for (const flag of ['PUBLIC_TESTS_ENABLED', 'PUBLIC_KNOWLEDGE_ENABLED']) {
		if (env[flag] !== 'false') throw new Error(`${flag} must be explicitly false`);
	}
}
NODE_ENV_CHECK
./node_modules/.bin/prisma generate

echo "Building candidate before any database migration"
NEXT_DEPLOYMENT_ID="$RELEASE_ID" npm run build
test -s .next/BUILD_ID

# Turbopack must build from a closed project tree. Attach mutable paths only
# after the build, otherwise a symlink that points outside the release root can
# make its filesystem traversal panic. Runtime releases still share uploads and
# operator-only backups across promotion and rollback.
install -d -m 755 "$DEPLOY_ROOT/public/uploads" "$DEPLOY_ROOT/public/music/uploads"
for relative_path in public/uploads public/music/uploads backups theory; do
	shared_path="$DEPLOY_ROOT/$relative_path"
	if [[ ! -e "$shared_path" ]]; then
		continue
	fi
	release_path="$RELEASE_DIR/$relative_path"
	mkdir -p "$(dirname "$release_path")"
	rm -rf -- "$release_path"
	ln -s "$shared_path" "$release_path"
done

echo "Creating a fresh pre-migration database backup"
"$BACKUP_COMMAND"
BACKUP_COMPLETED="yes"
printf 'backup_completed_at=%s\n' "$(date -u +%FT%TZ)" >>"$RELEASE_DIR/.deploy-metadata"

echo "Applying committed migrations and syncing canonical Active Recall decks"
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx scripts/replace-active-recall-revisions.ts

echo "Removing build-only development dependencies from the runtime release"
HUSKY=0 npm prune --omit=dev --ignore-scripts --no-package-lock
test -x ./node_modules/.bin/next

if ss -ltnH | awk '{ print $4 }' | grep -Eq ":${CANDIDATE_PORT}$"; then
	echo "Candidate port is already in use: $CANDIDATE_PORT" >&2
	exit 1
fi

echo "Starting isolated candidate on 127.0.0.1:$CANDIDATE_PORT"
NODE_ENV=production NEXT_DEPLOYMENT_ID="$RELEASE_ID" \
	pm2 start "$RELEASE_DIR/node_modules/.bin/next" \
		--name "$CANDIDATE_NAME" --cwd "$RELEASE_DIR" --time -- \
		start -H 127.0.0.1 -p "$CANDIDATE_PORT"

wait_for_ready "$CANDIDATE_PORT" 30 || {
	echo "Candidate did not become ready" >&2
	exit 1
}

curl --fail --silent --show-error --max-time 10 \
	"http://127.0.0.1:${CANDIDATE_PORT}/api/health/live" >/dev/null
curl --fail --silent --show-error --max-time 10 \
	"http://127.0.0.1:${CANDIDATE_PORT}/api/auth/providers" \
	| node -e '
		let input = "";
		process.stdin.on("data", (chunk) => { input += chunk; });
		process.stdin.on("end", () => {
			const providers = JSON.parse(input);
			if (!providers.google?.callbackUrl) process.exit(1);
		});
	'
assert_application_smoke "http://127.0.0.1:${CANDIDATE_PORT}"

if wait_for_ready "$LIVE_PORT" 1 && \
	assert_application_smoke "http://127.0.0.1:${LIVE_PORT}"; then
	ROLLBACK_SMOKE_SAFE=1
	echo "The previous release passed the required rollback smoke."
else
	echo "WARNING: the previous release is not a safe automatic rollback target." >&2
	echo "A failed promotion will stop PM2 to keep unfinished public features fail-closed." >&2
fi
printf 'rollback_smoke_safe=%s\n' "$ROLLBACK_SMOKE_SAFE" >>"$RELEASE_DIR/.deploy-metadata"

pm2 delete "$CANDIDATE_NAME" >/dev/null
echo "Promoting releases/$RELEASE_ID (previous: $PREVIOUS_TARGET)"
atomic_current_link "releases/$RELEASE_ID"
SWAPPED=1

start_or_reload_live
wait_for_ready "$LIVE_PORT" 30 || {
	echo "Promoted release failed local readiness" >&2
	exit 1
}

curl --fail --silent --show-error --max-time 15 \
	"$PUBLIC_URL/api/health/live" >/dev/null
curl --fail --silent --show-error --max-time 15 \
	"$PUBLIC_URL/api/health/ready" >/dev/null
curl --fail --silent --show-error --max-time 15 \
	"$PUBLIC_URL/api/auth/providers" \
	| node -e '
		let input = "";
		process.stdin.on("data", (chunk) => { input += chunk; });
		process.stdin.on("end", () => {
			const providers = JSON.parse(input);
			if (!providers.google?.callbackUrl) process.exit(1);
		});
	'
assert_application_smoke "$PUBLIC_URL"

pm2 save --force
SWAPPED=0
printf 'release=%s\nsource_sha=%s\nbuild_id=' "$RELEASE_ID" "$SOURCE_SHA"
cat "$RELEASE_DIR/.next/BUILD_ID"
echo "Production health and PM2 startup snapshot are current."
REMOTE_DEPLOY

log "Deploy complete: $PUBLIC_URL (release $DEPLOY_RELEASE_ID)"
