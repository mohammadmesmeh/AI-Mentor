#!/usr/bin/env bash
# Creates an isolated git worktree branched off --base, pulls in ONLY the
# changes for the paths listed in --paths-file (read live from the caller's
# actual working tree), and commits them there with --message-file.
#
# The caller's working tree is only ever READ from -- never modified. If a
# path fails to apply cleanly (e.g. --base diverges too far from that file's
# current HEAD version), it is reported and skipped rather than silently
# dropped, so the caller can retry with a different base, resolve it by
# hand, or ask the user.
#
# On success, writes a manifest file next to the worktree listing exactly
# which paths were committed -- check_coverage.sh reads these to prove every
# changed path ended up on exactly one branch.
#
# Usage:
#   apply_group.sh --base <ref> --branch <name> \
#       --paths-file <file, one path per line> --message-file <file>
#       [--worktree-root <dir>]
#
# Exit codes: 0 = full success. 1 = hard failure (nothing committed).
#             3 = partial success (commit happened, but some paths failed).

set -uo pipefail

# See snapshot.sh for why: never let git's default path-quoting for
# non-ASCII/unusual filenames leak into anything this skill parses.
git() { command git -c core.quotePath=false "$@"; }

base=""
branch=""
paths_file=""
message_file=""
worktree_root=""

while [ $# -gt 0 ]; do
  case "$1" in
    --base) base="$2"; shift 2 ;;
    --branch) branch="$2"; shift 2 ;;
    --paths-file) paths_file="$2"; shift 2 ;;
    --message-file) message_file="$2"; shift 2 ;;
    --worktree-root) worktree_root="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

: "${base:?--base is required}"
: "${branch:?--branch is required}"
: "${paths_file:?--paths-file is required}"
: "${message_file:?--message-file is required}"
[ -f "$paths_file" ] || { echo "ERROR: paths file not found: $paths_file" >&2; exit 1; }
[ -f "$message_file" ] || { echo "ERROR: message file not found: $message_file" >&2; exit 1; }

worktree_root="${worktree_root:-$repo_root/.git/change-organizer/worktrees}"
worktree_dir="$worktree_root/$branch"
# Branch names routinely contain "/" (feat/x, fix/y). worktree_dir can have
# nested dirs fine (git creates them), but sidecar files below are flat
# filenames next to worktree_root -- sanitize so "feat/x" doesn't get read
# as a path needing a "feat/" directory that was never created.
safe_name=$(printf '%s' "$branch" | tr '/' '_')

mkdir -p "$worktree_root"

if [ -e "$worktree_dir" ]; then
  echo "ERROR: worktree dir already exists: $worktree_dir (pick a different --branch or clean it up first)" >&2
  exit 1
fi

if ! git worktree add -b "$branch" "$worktree_dir" "$base" >/dev/null 2>"$worktree_root/${safe_name}.worktree.err"; then
  echo "ERROR: failed to create worktree for branch '$branch' off '$base':" >&2
  cat "$worktree_root/${safe_name}.worktree.err" >&2
  exit 1
fi

applied_log=()
failed_log=()
manifest="$worktree_root/${safe_name}.manifest.txt"
: > "$manifest"

while IFS= read -r path; do
  [ -z "$path" ] && continue
  dest="$worktree_dir/$path"
  if [ -f "$path" ]; then
    if git ls-files --error-unmatch -- "$path" >/dev/null 2>&1; then
      # Tracked file with an uncommitted modification -- carry the exact diff.
      diff_out=$(git diff HEAD -- "$path")
      if [ -n "$diff_out" ]; then
        if echo "$diff_out" | git -C "$worktree_dir" apply --index - 2>"$worktree_root/${safe_name}.apply.err"; then
          applied_log+=("modified: $path")
          echo "$path" >> "$manifest"
        else
          failed_log+=("$path (patch did not apply cleanly against base '$base')")
        fi
      fi
    else
      # Untracked new file -- copy as-is.
      mkdir -p "$(dirname "$dest")"
      if cp -- "$path" "$dest" && git -C "$worktree_dir" add -- "$path"; then
        applied_log+=("added: $path")
        echo "$path" >> "$manifest"
      else
        failed_log+=("$path (failed to copy/add new file)")
      fi
    fi
  else
    # Path no longer exists in the working tree -- a deletion.
    if [ -f "$dest" ]; then
      if git -C "$worktree_dir" rm -q -- "$path" >/dev/null 2>&1; then
        applied_log+=("deleted: $path")
        echo "$path" >> "$manifest"
      else
        failed_log+=("$path (failed to apply deletion)")
      fi
    else
      # Neither present in the working tree nor in the worktree's base --
      # this path from --paths-file doesn't correspond to anything real.
      # Never let that pass silently (it's exactly how a mis-encoded path
      # from an upstream listing could vanish without a trace): treat it
      # as a failure so the caller sees it and check_coverage.sh's MISSING
      # report has a matching explanation instead of a mystery.
      failed_log+=("$path (not found in working tree or in base '$base' -- check for encoding/quoting issues in how this path was listed)")
    fi
  fi
done < "$paths_file"

if [ ${#applied_log[@]} -eq 0 ]; then
  echo "ERROR: no changes were applied to '$branch' -- nothing to commit. Removing empty worktree." >&2
  printf '  FAILED: %s\n' "${failed_log[@]}" >&2
  git worktree remove --force "$worktree_dir" >/dev/null 2>&1 || true
  rm -f "$manifest"
  exit 1
fi

if ! git -C "$worktree_dir" commit --quiet -F "$message_file"; then
  echo "ERROR: commit failed on branch '$branch' -- worktree left in place at $worktree_dir for inspection." >&2
  exit 1
fi

echo "OK: committed ${#applied_log[@]} path(s) to branch '$branch' at $worktree_dir"
printf '  %s\n' "${applied_log[@]}"

if [ ${#failed_log[@]} -gt 0 ]; then
  echo "WARNING: ${#failed_log[@]} path(s) failed to apply and were NOT committed -- handle these before declaring this group done:" >&2
  printf '  FAILED: %s\n' "${failed_log[@]}" >&2
  exit 3
fi

exit 0
