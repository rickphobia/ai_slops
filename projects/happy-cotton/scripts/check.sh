#!/usr/bin/env bash
# Everything CI runs, in order, so you can run it locally: format check, lint,
# type check, tests. Stops at the first failing step and says which one.
# Needs `godot` (see scripts/setup-godot.sh) and gdtoolkit (pip install -r requirements.txt).
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
godot_bin="${GODOT:-godot}"
gdbin="${GDTOOLKIT_BIN:-.venv/bin}"
code_dirs=(src tests)

step() { echo; echo "==> $*"; }
fail() { echo "check: FAILED at: $1" >&2; exit 1; }

step "format check (gdformat)"
"$gdbin/gdformat" --check "${code_dirs[@]}" || fail "format check (fix with: $gdbin/gdformat src tests)"

step "lint (gdlint)"
"$gdbin/gdlint" "${code_dirs[@]}" || fail "lint"

# Godot's import exits 0 even when a script has errors, so read its output instead of its exit code.
# Untyped declarations and unsafe calls are configured as errors in project.godot.
step "type check (headless import, warnings are errors)"
import_log="$(mktemp)"
trap 'rm -f "$import_log"' EXIT
"$godot_bin" --headless --import >"$import_log" 2>&1
if grep -Eq "SCRIPT ERROR|^ERROR:|Parse Error|Compile Error" "$import_log"; then
  cat "$import_log" >&2
  fail "type check (see errors above)"
fi
# --check-only does return a failing exit code, so it covers each file on its own too.
while IFS= read -r script; do
  "$godot_bin" --headless --check-only --script "$script" >"$import_log" 2>&1 || {
    cat "$import_log" >&2
    fail "type check of $script"
  }
done < <(find "${code_dirs[@]}" -name '*.gd' | sort)

step "tests (GUT)"
"$godot_bin" --headless -s addons/gut/gut_cmdln.gd || fail "tests"

echo
echo "check: all steps passed"
