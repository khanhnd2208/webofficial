#!/usr/bin/env bash
# Claude Code SessionStart hook: a two-line workspace summary, so an agent
# notices someone else's uncommitted work before it edits anything.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || exit 0
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
echo "Workspace: branch ${branch}, ${dirty} uncommitted file(s)."
if [[ "$branch" == "main" && "$dirty" -gt 0 ]]; then
	echo "This checkout has uncommitted work that may not be yours. Do not edit or commit it; start the task in a new worktree (AGENTS.md > Workspace)."
fi
