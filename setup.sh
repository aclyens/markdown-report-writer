#!/bin/bash

set -e

# Build the Docker image
docker build -t markdown-report-writer .

# Install markdown-report.sh to /usr/local/bin so it is on the PATH
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 755 "$SCRIPT_DIR/markdown-report.sh" /usr/local/bin/markdown-report
echo "Installed: /usr/local/bin/markdown-report"
echo ""
echo "You can now run: markdown-report <pdf|confluence> <input.md>"
