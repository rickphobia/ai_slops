#!/usr/bin/env bash
# Builds a PR's web version on this machine and serves it on the local network, so you can try it
# from a laptop or phone before merging. For PRs whose build is too big for a `▶ Try this version`
# Artifact link (my-piggy's engine file is ~40 MB).
#
# Usage: scripts/try-pr.sh <PR number> [--port N] [--keep]
#   --port N   port to serve on (default 8000)
#   --keep     keep the build folder after you stop the server (faster next time)
#   --projects print the projects it can build, one per line, and exit
#
# The PR is checked out in .claude/worktrees/try-pr-<N>, so no other checkout changes branch.
# Press Ctrl+C to stop; the folder is then removed unless --keep was given.
set -euo pipefail

die() {
  printf 'try-pr: %s\n' "$*" >&2
  exit 1
}

usage() {
  sed -n '6,10p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

# The projects build_web knows. scripts/previews.sh reads this list through --projects.
web_projects=(my-piggy pawn-swarm)

# Builds the project in the current folder and prints the folder to serve. Each web project's
# build steps come from its README.
build_web() {
  case $1 in
    my-piggy)
      command -v godot >/dev/null || die "godot not found; run projects/my-piggy/scripts/setup-godot.sh"
      godot --headless --import >&2
      mkdir -p build/web
      godot --headless --export-release Web build/web/index.html >&2
      echo build/web
      ;;
    pawn-swarm)
      npm ci >&2
      npm run build >&2
      echo dist
      ;;
    *) die "don't know how to build '$1'; add it to build_web and web_projects in $0" ;;
  esac
}

main() {
  local pr="" port=8000 keep=0
  while (($# > 0)); do
    case $1 in
      --port) port=${2:?--port needs a number}; shift ;;
      --keep) keep=1 ;;
      --projects) printf '%s\n' "${web_projects[@]}"; exit 0 ;;
      -h | --help) usage 0 ;;
      -*) die "unknown option $1 (see --help)" ;;
      *) [[ -z $pr && $1 =~ ^[0-9]+$ ]] || die "not a PR number: $1"; pr=$1 ;;
    esac
    shift
  done
  [[ -n $pr ]] || usage 1

  cd "$(git rev-parse --show-toplevel)"
  local -a projects
  mapfile -t projects < <(gh pr view "$pr" --json files --jq '.files[].path' |
    sed -n -E 's#^projects/([^/]+)/.*#\1#p' | sort -u)
  ((${#projects[@]} == 1)) || die "PR #$pr should change exactly one project, it changes: ${projects[*]:-none}"
  local project=${projects[0]}

  git fetch -q origin "pull/$pr/head" || die "could not fetch PR #$pr"
  local sha worktree=".claude/worktrees/try-pr-$pr"
  sha=$(git rev-parse FETCH_HEAD)
  if [[ -d $worktree ]]; then
    git -C "$worktree" checkout -q --detach "$sha"
  else
    git worktree add -q --detach "$worktree" "$sha"
  fi
  if ((!keep)); then
    # shellcheck disable=SC2064 # expand now: the paths are fixed
    trap "cd '$PWD' && git worktree remove --force '$worktree' && echo 'Removed $worktree.'" EXIT
    # Turn Ctrl+C, a closed terminal or kill into a normal exit, so the EXIT trap always runs.
    trap 'exit 130' INT TERM HUP
  fi

  printf 'Building PR #%s (%s, %s)…\n' "$pr" "$project" "$(git rev-parse --short "$sha")"
  cd "$worktree/projects/$project"
  local site
  site=$(build_web "$project")

  local ip
  ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  printf '\nPR #%s is at http://%s:%s/ (from this machine: http://localhost:%s/). Ctrl+C to stop.\n' \
    "$pr" "${ip:-<this machine>}" "$port" "$port"
  python3 -m http.server --bind 0.0.0.0 --directory "$site" "$port"
}

main "$@"
