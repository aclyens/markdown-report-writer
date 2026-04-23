#!/usr/bin/env bash
set -euo pipefail

USAGE="Usage: $(basename "$0") <pdf|confluence> <input.md>"

if [ $# -lt 2 ]; then
  echo "$USAGE" >&2
  exit 1
fi

SUBCOMMAND="$1"
INPUT="$2"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: File not found: $INPUT" >&2
  exit 1
fi

case "$SUBCOMMAND" in
  pdf|confluence) ;;
  *)
    echo "ERROR: Unknown subcommand '$SUBCOMMAND'. Must be 'pdf' or 'confluence'." >&2
    echo "$USAGE" >&2
    exit 1
    ;;
esac

# Resolve absolute paths so the mount and filename are unambiguous
INPUT_ABS="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"
INPUT_DIR="$(dirname "$INPUT_ABS")"
INPUT_FILE="$(basename "$INPUT_ABS")"

docker run --rm \
  -v "${INPUT_DIR}:/data" \
  markdown-report-writer \
  "$SUBCOMMAND" "/data/${INPUT_FILE}"
