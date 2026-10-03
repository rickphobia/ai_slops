#!/usr/bin/env bash
# Downloads the pinned Godot (Linux, x86_64) and its export templates, checks them
# against the pinned checksums, and installs them.
#   Godot binary -> $GODOT_INSTALL_DIR (default ~/.local/bin) as `godot`
#   Templates    -> ~/.local/share/godot/export_templates/<version>.stable/ (web only)
# Re-running is safe: it skips what is already installed at the pinned version.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=godot-pin.env
source "$here/godot-pin.env"

install_dir="${GODOT_INSTALL_DIR:-$HOME/.local/bin}"
template_dir="${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/${GODOT_VERSION}.stable"
base_url="https://github.com/godotengine/godot-builds/releases/download/${GODOT_VERSION}-stable"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

step() { echo "setup-godot: $*"; }
fail() { echo "setup-godot: FAILED while $1" >&2; exit 1; }

download_and_check() { # name expected_sha512
  step "downloading $1"
  curl --fail --location --silent --show-error --retry 3 --output "$work/$1" "$base_url/$1" ||
    fail "downloading $1"
  echo "$2  $work/$1" | sha512sum --check --status || fail "checking the checksum of $1 (file is not the pinned release)"
}

mkdir -p "$install_dir"
if [[ -x "$install_dir/godot" ]] && "$install_dir/godot" --version | grep -q "^${GODOT_VERSION}\.stable"; then
  step "godot $GODOT_VERSION already installed"
else
  zip="Godot_v${GODOT_VERSION}-stable_linux.x86_64.zip"
  download_and_check "$zip" "$GODOT_LINUX_ZIP_SHA512"
  unzip -q -o "$work/$zip" -d "$work" || fail "unzipping $zip"
  install -m 0755 "$work/Godot_v${GODOT_VERSION}-stable_linux.x86_64" "$install_dir/godot" || fail "installing godot"
fi

if [[ -f "$template_dir/web_nothreads_release.zip" ]]; then
  step "web export templates already installed"
else
  tpz="Godot_v${GODOT_VERSION}-stable_export_templates.tpz"
  download_and_check "$tpz" "$GODOT_TEMPLATES_SHA512"
  mkdir -p "$template_dir"
  # The full bundle is 1.3 GB because it holds every platform; the web build needs two files.
  unzip -q -j -o "$work/$tpz" 'templates/web_nothreads_*' 'templates/version.txt' -d "$template_dir" ||
    fail "unzipping the web export templates"
fi

step "done. Make sure $install_dir is on your PATH."
"$install_dir/godot" --version
