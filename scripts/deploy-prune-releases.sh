#!/usr/bin/env bash
# Frees VPS disk before a release is staged. Run by scripts/deploy-vps.sh under
# the deploy lock; safe to run by hand with --dry-run.
#
# Usage:
#   deploy-prune-releases.sh [--dry-run] <deploy-root> <keep-releases> <min-free-gb> [protected-id...]
#
# 1. Keeps `current`, every protected release, and the <keep-releases> newest
#    other release directories; deletes the rest (failed and superseded ones).
# 2. Drops `.next/cache` from kept releases other than `current`. Only the next
#    build reads it, and it copies it from `current`; runtime and rollback do not.
# 3. Clears the npm download cache once it passes NPM_CACHE_MAX_GB, because npm
#    never evicts entries on its own.
# 4. Fails when the disk still has less than <min-free-gb> free, so a deploy
#    stops before a full disk takes MongoDB or PostgreSQL down with it.

set -Eeuo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
	DRY_RUN=1
	shift
fi

deploy_root="${1:-}"
keep="${2:-}"
min_free_gb="${3:-}"
shift 3 || true
npm_cache_max_gb="${NPM_CACHE_MAX_GB:-4}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$deploy_root" =~ ^/[A-Za-z0-9._/-]+$ && "$deploy_root" != "/" ]] || die "Unsafe deploy root: $deploy_root"
[[ "$keep" =~ ^[1-9][0-9]*$ ]] || die "keep-releases must be a positive integer"
[[ "$min_free_gb" =~ ^[0-9]+$ ]] || die "min-free-gb must be a whole number"
[[ "$npm_cache_max_gb" =~ ^[0-9]+$ ]] || die "NPM_CACHE_MAX_GB must be a whole number"
[[ -d "$deploy_root" ]] || die "Deploy root does not exist: $deploy_root"

releases_dir="$deploy_root/releases"
id_pattern='^[A-Za-z0-9._-]+$'

remove() {
	if ((DRY_RUN)); then
		printf 'would remove %s\n' "$1"
	else
		rm -rf -- "$1"
		printf 'removed %s\n' "$1"
	fi
}

free_kb() { df -Pk "$deploy_root" | awk 'NR == 2 { print $4 }'; }

current_id=""
if [[ -L "$deploy_root/current" ]]; then
	current_target="$(readlink "$deploy_root/current")"
	if [[ "$current_target" =~ ^releases/([A-Za-z0-9._-]+)$ ]]; then
		current_id="${BASH_REMATCH[1]}"
		[[ -d "$releases_dir/$current_id" ]] || die "current points at a missing release: $current_target"
	elif [[ "$current_target" != "." ]]; then
		die "current has an unexpected target: $current_target"
	fi
elif [[ -e "$deploy_root/current" ]]; then
	die "$deploy_root/current exists but is not a symlink"
fi

protected=" $current_id "
for id in "$@"; do
	[[ "$id" =~ $id_pattern ]] || die "Unsafe protected release id: $id"
	protected+="$id "
done
is_protected() { [[ "$protected" == *" $1 "* ]]; }

before_kb="$(free_kb)"

shopt -s nullglob
release_dirs=("$releases_dir"/*/)
shopt -u nullglob
if ((${#release_dirs[@]} > 0)); then
	# Release ids are not time-ordered (CI uses <sha>-<run>-<attempt>), so order by
	# the directory's mtime, which is set while the release is staged and built.
	kept=0
	while IFS= read -r path; do
		path="${path%/}"
		id="${path##*/}"
		if [[ -L "$path" || ! "$id" =~ $id_pattern ]]; then
			printf 'skipping unexpected entry %s\n' "$path" >&2
			continue
		fi
		if is_protected "$id"; then
			continue
		elif ((kept < keep)); then
			kept=$((kept + 1))
		else
			remove "$path"
			continue
		fi
		if [[ -d "$path/.next/cache" ]]; then
			remove "$path/.next/cache"
		fi
	done < <(ls -1dt -- "${release_dirs[@]}")
fi

if command -v npm >/dev/null 2>&1; then
	npm_cache_dir="$(npm config get cache 2>/dev/null || true)"
	if [[ -n "$npm_cache_dir" && -d "$npm_cache_dir/_cacache" ]]; then
		npm_cache_kb="$(du -sk "$npm_cache_dir/_cacache" | awk '{ print $1 }')"
		if ((npm_cache_kb > npm_cache_max_gb * 1024 * 1024)); then
			if ((DRY_RUN)); then
				printf 'would clear the npm cache (%s MB)\n' "$((npm_cache_kb / 1024))"
			else
				npm cache clean --force >/dev/null 2>&1
				printf 'cleared the npm cache (%s MB)\n' "$((npm_cache_kb / 1024))"
			fi
		fi
	fi
fi

after_kb="$(free_kb)"
printf 'disk free: %s MB before, %s MB after\n' "$((before_kb / 1024))" "$((after_kb / 1024))"

if ((after_kb < min_free_gb * 1024 * 1024)); then
	die "Only $((after_kb / 1024)) MB free under $deploy_root; a deploy needs at least ${min_free_gb} GB. Free space by hand (see docs/deployment/VPS.md, Disk space) before deploying."
fi
