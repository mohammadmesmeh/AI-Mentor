#!/usr/bin/env bash
# Safety gate: proves every uncommitted path recorded by snapshot.sh has
# landed on exactly one group branch before you tell the user the split is
# complete, push anything, or touch the original working tree.
#
# Reads the manifest files apply_group.sh writes next to each worktree --
# no re-derivation from git history needed, so it's robust to whatever base
# each branch happened to use.
#
# Usage: check_coverage.sh <snapshot-dir> <worktree-root> <branch1> [branch2 ...]
# Exit: 0 = every path accounted for exactly once. 1 = missing and/or
#       duplicated paths found -- do not proceed until this is clean.

set -euo pipefail

snapshot_dir="$1"; shift
worktree_root="$1"; shift
branches=("$@")

expected="$snapshot_dir/all_changed_paths.txt"
[ -f "$expected" ] || { echo "ERROR: $expected not found -- run snapshot.sh first" >&2; exit 1; }
[ ${#branches[@]} -gt 0 ] || { echo "ERROR: list at least one branch to check" >&2; exit 1; }

all_committed=$(mktemp)
trap 'rm -f "$all_committed"' EXIT

for b in "${branches[@]}"; do
  # Must match the sanitization apply_group.sh applies to branch names
  # containing "/" when naming its sidecar manifest file.
  safe_name=$(printf '%s' "$b" | tr '/' '_')
  m="$worktree_root/${safe_name}.manifest.txt"
  if [ ! -f "$m" ]; then
    echo "ERROR: no manifest for branch '$b' at $m -- did apply_group.sh run (and succeed) for it?" >&2
    exit 1
  fi
  sed "s|\$| $b|" "$m" >> "$all_committed"
done

missing=$(comm -23 <(sort -u "$expected") <(awk '{print $1}' "$all_committed" | sort -u) || true)
dup_paths=$(awk '{print $1}' "$all_committed" | sort | uniq -d || true)

status=0

if [ -n "$missing" ]; then
  echo "MISSING -- these changed paths were never committed to any group branch:"
  echo "$missing" | sed 's/^/  /'
  status=1
fi

if [ -n "$dup_paths" ]; then
  echo "DUPLICATE -- these paths were committed to more than one branch:"
  while IFS= read -r p; do
    echo "  $p ->"
    grep -F "$p " "$all_committed" | awk '{print "    "$2}'
  done <<< "$dup_paths"
  status=1
fi

if [ "$status" -eq 0 ]; then
  echo "OK -- every changed path is committed on exactly one branch:"
  sort "$all_committed" | awk '{print "  "$1" -> "$2}'
fi

exit $status
