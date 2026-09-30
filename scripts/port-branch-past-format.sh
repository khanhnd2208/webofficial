#!/usr/bin/env bash
# Port a branch that started before the repo-wide Prettier commit onto a newer
# base without formatting conflicts.
#
# A plain merge or rebase conflicts wherever a real edit sits next to a line
# Prettier reformatted. This script formats the branch's files on both sides
# (the old merge base and the branch tip), takes the diff between the two
# formatted snapshots (real edits only), and applies it with a 3-way apply on
# a new branch cut from the target.
#
# Usage (from the branch to port, with everything committed):
#   bash scripts/port-branch-past-format.sh [target-ref]   # default: origin/main
#
# Result: a new branch <current>-ported with the changes staged, not committed.
# Review `git diff --cached`, run the checks, then commit.
set -euo pipefail

target="${1:-origin/main}"
repo="$(git rev-parse --show-toplevel)"
cd "$repo"

if [[ -n "$(git status --porcelain)" ]]; then
	echo "Commit or stash your changes first; the working tree must be clean." >&2
	exit 1
fi

source_branch="$(git rev-parse --abbrev-ref HEAD)"
tip="$(git rev-parse HEAD)"
base="$(git merge-base HEAD "$target")"
ported="${source_branch}-ported"

if git show-ref --verify --quiet "refs/heads/$ported"; then
	echo "Branch $ported already exists. Delete it or rename it first." >&2
	exit 1
fi

# Plain while-read loop: macOS ships bash 3.2, which has no mapfile.
files=()
while IFS= read -r file; do
	if [[ -n "$file" && "$file" != "package-lock.json" ]]; then files+=("$file"); fi
done < <(
	git diff --name-only --diff-filter=AM "$base" "$tip" -- \
		'*.ts' '*.tsx' '*.mjs' '*.css' '*.json' '*.yml'
)

scratch="$(mktemp -d)"
cleanup() {
	git worktree remove --force "$scratch/base" >/dev/null 2>&1 || true
	git worktree remove --force "$scratch/tip" >/dev/null 2>&1 || true
	rm -rf "$scratch"
}
trap cleanup EXIT

# Format the same file list in a detached snapshot and commit it there.
formatted_snapshot() {
	local ref="$1" dir="$2"
	git worktree add --quiet --detach "$dir" "$ref"
	ln -s "$repo/node_modules" "$dir/node_modules"
	local existing=()
	for file in ${files[@]+"${files[@]}"}; do
		if [[ -f "$dir/$file" ]]; then existing+=("$file"); fi
	done
	if ((${#existing[@]} > 0)); then
		(cd "$dir" && npx prettier --write --log-level warn "${existing[@]}")
	fi
	rm "$dir/node_modules"
	git -C "$dir" add -A
	git -C "$dir" -c core.hooksPath=/dev/null commit --quiet --allow-empty -m "formatted snapshot"
	git -C "$dir" rev-parse HEAD
}

echo "Formatting ${#files[@]} file(s) at the merge base and at the branch tip..."
formatted_base="$(formatted_snapshot "$base" "$scratch/base" | tail -1)"
formatted_tip="$(formatted_snapshot "$tip" "$scratch/tip" | tail -1)"

patch="$scratch/changes.patch"
git diff --binary "$formatted_base" "$formatted_tip" > "$patch"
if [[ ! -s "$patch" ]]; then
	echo "No changes to port."
	exit 0
fi

git switch --quiet -c "$ported" "$target"
if git apply --3way --index "$patch"; then
	echo "Ported onto $target as branch $ported (changes staged, not committed)."
else
	echo "Ported with conflicts on branch $ported. Resolve the files marked by git status, then stage them." >&2
	exit 1
fi
echo "Next: git diff --cached, npm run check (or the checks in AGENTS.md), then commit."
