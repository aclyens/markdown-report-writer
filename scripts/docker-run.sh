#!/usr/bin/env bash
set -euo pipefail

# Run any command inside the markdown-report-writer Docker container.
# The current working directory is mounted at /data and set as the working
# directory inside the container, so relative file paths work as expected.
#
# Usage:
#   ./docker-run.sh <command> [args...]
#
# Examples:
#   ./docker-run.sh markdown-report pdf report.md
#   ./docker-run.sh node --test
#   ./docker-run.sh bash

IMAGE="markdown-report-writer"
CWD_ABS="$(pwd)"

docker run --rm \
  -v "${CWD_ABS}:/data" \
  -w /data \
  --entrypoint "" \
  "$IMAGE" \
  "$@"
