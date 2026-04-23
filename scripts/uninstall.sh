#!/usr/bin/env bash
# uninstall-local.sh — Remove all locally installed markdown-report CLI scripts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

removed=0

# 1. npm global link (installed by install-local.sh / npm link)
echo "==> Checking npm global link..."
cd "$REPO_DIR"
if npm ls --global --depth=0 markdown-report &>/dev/null; then
  npm unlink --global
  echo "    Removed npm global link."
  removed=$((removed + 1))
else
  echo "    No npm global link found."
fi

# 2. Remove any remaining markdown-report* files found on PATH or common locations
echo "==> Scanning for leftover markdown-report scripts..."
SEARCH_DIRS=(
  /usr/local/bin
  /usr/bin
  "$HOME/.local/bin"
)

# Include Windows-side npm prefix if accessible (WSL)
WIN_NODE_DIR="/mnt/c/Program Files/nvm4w/nodejs"
if [ -d "$WIN_NODE_DIR" ]; then
  SEARCH_DIRS+=("$WIN_NODE_DIR")
fi

for dir in "${SEARCH_DIRS[@]}"; do
  [ -d "$dir" ] || continue
  while IFS= read -r -d '' file; do
    rm -f "$file"
    echo "    Removed: $file"
    removed=$((removed + 1))
  done < <(find "$dir" -maxdepth 1 -name "markdown-report*" -print0 2>/dev/null)
done

echo ""
if [ "$removed" -gt 0 ]; then
  echo "Uninstall complete — removed $removed item(s)."
else
  echo "Nothing to remove — markdown-report was not installed."
fi
