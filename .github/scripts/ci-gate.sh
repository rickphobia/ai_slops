#!/usr/bin/env bash
# Waits for every other workflow run on a pull request's head commit and fails unless all pass.
#
# Each project's workflow runs only when its own folder changes, so none of them can be a
# required check: a workflow skipped by its `paths:` filter never reports, and a required check
# that never reports blocks the PR forever. This script is the one check `main` requires instead.
#
# Convention: projects/<name>/ is checked by .github/workflows/<name>.yml. When a PR changes
# either, that workflow must run on the PR's head commit; if it never shows up, the gate fails.
#
# Settings (environment variables):
#   GH_TOKEN, REPO, PR_NUMBER, HEAD_SHA   required; set by .github/workflows/ci-gate.yml
#   GATE_POLL_SECONDS     seconds between checks (default 20)
#   GATE_TIMEOUT_SECONDS  give up after this long (default 1500)
#   GATE_SETTLE_SECONDS   wait this long first, so the other runs are registered (default 15)
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN must be set (the gh CLI reads it)}"
: "${REPO:?REPO must be set, e.g. owner/name}"
: "${PR_NUMBER:?PR_NUMBER must be set}"
: "${HEAD_SHA:?HEAD_SHA must be set}"
poll_seconds="${GATE_POLL_SECONDS:-20}"
timeout_seconds="${GATE_TIMEOUT_SECONDS:-1500}"
settle_seconds="${GATE_SETTLE_SECONDS:-15}"

readonly self_path=".github/workflows/ci-gate.yml"

log() { printf 'ci-gate: %s\n' "$*"; }

# Prints the workflow file of every project (or project workflow) the PR changes, one per line.
expected_workflows() {
  local files
  files="$(gh api --paginate "repos/$REPO/pulls/$PR_NUMBER/files" --jq '.[].filename')"
  sed -n -E 's#^projects/([^/]+)/.*#\1#p; s#^\.github/workflows/([^/]+)\.yml$#\1#p' <<<"$files" |
    sort -u |
    while read -r name; do
      local path=".github/workflows/$name.yml"
      if [[ $path != "$self_path" && -f $path ]]; then
        echo "$path"
      fi
    done
}

# Prints "path<TAB>status<TAB>conclusion<TAB>url" for every other workflow run on HEAD_SHA.
other_runs() {
  gh api "repos/$REPO/actions/runs?head_sha=$HEAD_SHA&per_page=100" \
    --jq ".workflow_runs[] | select(.path != \"$self_path\")
          | [.path, .status, (.conclusion // \"\"), .html_url] | @tsv"
}

main() {
  local expected_out
  expected_out="$(expected_workflows)"
  local -a expected=()
  if [[ -n $expected_out ]]; then
    mapfile -t expected <<<"$expected_out"
  fi
  log "PR #$PR_NUMBER at ${HEAD_SHA:0:12}; must run: ${expected[*]:-nothing (no project changed)}"

  sleep "$settle_seconds"
  local deadline=$((SECONDS + timeout_seconds))

  while true; do
    local runs_out
    if ! runs_out="$(other_runs)"; then
      log "listing workflow runs failed; trying again"
      runs_out=""
    fi
    local -a runs=() missing=() pending=() failed=()
    local -A started=()
    if [[ -n $runs_out ]]; then
      mapfile -t runs <<<"$runs_out"
    fi

    local run path status conclusion url
    for run in "${runs[@]}"; do
      IFS=$'\t' read -r path status conclusion url <<<"$run"
      started[$path]=1
      if [[ $status != completed ]]; then
        pending+=("$path")
      elif [[ $conclusion != success && $conclusion != skipped && $conclusion != neutral ]]; then
        failed+=("$path: $conclusion ($url)")
      fi
    done

    local want
    for want in "${expected[@]}"; do
      if [[ -z ${started[$want]:-} ]]; then
        missing+=("$want")
      fi
    done

    if ((${#failed[@]} > 0)); then
      log "failed:"
      printf '  %s\n' "${failed[@]}"
      log "fix it and push. If you re-run a failed workflow by hand, re-run this check after it."
      exit 1
    fi
    if ((${#missing[@]} == 0 && ${#pending[@]} == 0)); then
      log "passed: ${#runs[@]} other workflow run(s) on this commit, all green"
      exit 0
    fi
    if ((SECONDS >= deadline)); then
      log "timed out after ${timeout_seconds}s"
      log "never started: ${missing[*]:-none}"
      log "still running: ${pending[*]:-none}"
      exit 1
    fi
    log "waiting; not started: ${missing[*]:-none}; running: ${pending[*]:-none}"
    sleep "$poll_seconds"
  done
}

main "$@"
