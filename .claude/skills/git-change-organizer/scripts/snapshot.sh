#!/usr/bin/env bash
# Captures a full, deterministic snapshot of the current working tree's
# uncommitted state: branch info, per-file status, full diffs, and untracked
# files. Run this once at the START of an organize session — it's also the
# authoritative record `check_coverage.sh` later proves nothing was lost
# against.
#
# Usage: scripts/snapshot.sh [output-dir]
#   output-dir defaults to .git/change-organizer/<timestamp>

set -euo pipefail

# Git quotes "unusual" filenames (non-ASCII, spaces treated as special, etc.)
# in most listing/diff output by default (core.quotePath=true), e.g. an
# em-dash comes out as a C-style-escaped "\342\200\224" inside quotes rather
# than the literal UTF-8 bytes. Every downstream script in this skill treats
# paths as literal strings to open/copy/diff, so that escaping must never
# leak into any list this skill produces -- force it off for every git call
# here.
git() { command git -c core.quotePath=false "$@"; }

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

ts=$(date +%Y%m%d-%H%M%S)
out="${1:-.git/change-organizer/$ts}"
mkdir -p "$out"

branch=$(git rev-parse --abbrev-ref HEAD)
default_base=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
if [ -z "$default_base" ]; then
  for cand in main master; do
    if git show-ref --verify --quiet "refs/heads/$cand"; then
      default_base="$cand"
      break
    fi
  done
fi

{
  echo "# Git Change Organizer -- Snapshot"
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "Repo root: $repo_root"
  echo "Current branch: $branch"
  echo "Detected default/base branch: ${default_base:-UNKNOWN -- ask the user which branch to base groups on}"
  echo
  echo "## git status --porcelain=v1"
  git status --porcelain=v1
  echo
  echo "## Ahead/behind origin/$branch"
  git rev-list --left-right --count "origin/$branch...$branch" 2>/dev/null || echo "no upstream for $branch"
} > "$out/overview.md"

# Full diff of every tracked change (staged + unstaged combined) against HEAD.
git diff HEAD > "$out/tracked.diff" || true
git diff HEAD --stat > "$out/tracked.stat" || true

# Untracked files: list + best-effort content copy (skip what can't be read,
# e.g. binaries -- their presence is still recorded in the list either way).
git ls-files --others --exclude-standard > "$out/untracked.list"
mkdir -p "$out/untracked-content"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  dest="$out/untracked-content/$f"
  mkdir -p "$(dirname "$dest")"
  cp -- "$f" "$dest" 2>/dev/null || echo "  (content not copied -- likely binary: $f)" >> "$out/overview.md"
done < "$out/untracked.list"

# Canonical ground-truth list of every path with any uncommitted change.
# check_coverage.sh holds every group's committed paths against this.
{
  git diff HEAD --name-only
  cat "$out/untracked.list"
} | sort -u > "$out/all_changed_paths.txt"

echo "Snapshot written to: $out"
echo "$out"
