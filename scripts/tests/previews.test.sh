#!/usr/bin/env bash
# Tests how scripts/previews.sh writes a preview link into a PR body. It sources the script, so no
# command runs and nothing touches GitHub or systemd. Run: scripts/tests/previews.test.sh
set -euo pipefail

# shellcheck source=scripts/previews.sh
source "$(cd "$(dirname "$0")/.." && pwd)/previews.sh"
failures=0
url="https://box.tailnet.ts.net:9088/"
link="▶ Try this version: $url"

check() { # check <description> <expected> <actual>
  if [[ $3 == "$2" ]]; then
    printf 'ok   %s\n' "$1"
  else
    printf 'FAIL %s\n--- expected\n%s\n--- got\n%s\n' "$1" "$2" "$3"
    failures=$((failures + 1))
  fi
}

check "replaces the session's placeholder line" \
  "$(printf 'Ticket: t.md\n%s\n\n## Summary' "$link")" \
  "$(printf 'Ticket: t.md\n▶ No Artifact preview (index.wasm is 39.5 MB): try it with scripts/try-pr.sh 88\n\n## Summary' | body_with_link "$url")"

check "replaces an older link" \
  "$(printf 'Ticket: t.md\n%s\n\nText' "$link")" \
  "$(printf 'Ticket: t.md\n▶ Try this version: https://old.example/\n\nText' | body_with_link "$url")"

check "goes after the Ticket line when there is no preview line" \
  "$(printf 'Ticket: t.md\n%s\n\n## Summary' "$link")" \
  "$(printf 'Ticket: t.md\n\n## Summary' | body_with_link "$url")"

check "goes at the top, followed by a blank line, when there is no Ticket line" \
  "$(printf '%s\n\n## Summary\nText' "$link")" \
  "$(printf '## Summary\nText' | body_with_link "$url")"

check "an empty body gets just the link" \
  "$link" \
  "$(printf '' | body_with_link "$url")"

check "running it twice changes nothing more" \
  "$(printf 'Ticket: t.md\n%s\n\n## Summary' "$link")" \
  "$(printf 'Ticket: t.md\n\n## Summary' | body_with_link "$url" | body_with_link "$url")"

check "only the first preview line is replaced" \
  "$(printf '%s\n\n▶ quoted later in the body' "$link")" \
  "$(printf '▶ No Artifact preview\n\n▶ quoted later in the body' | body_with_link "$url")"

if ((failures > 0)); then
  printf '%d failed\n' "$failures"
  exit 1
fi
echo "all passed"
