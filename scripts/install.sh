#!/usr/bin/env bash
# install-local.sh — Install the markdown-report CLI locally (no Docker required)
#
# Prerequisites:
#   - Node.js >= 18
#   - pandoc (https://pandoc.org/installing.html)
#   - xelatex  (TeX Live or MiKTeX — PDF conversion only)
#   - eisvogel pandoc template (PDF conversion only)
#     https://github.com/Wandmalfarbe/pandoc-latex-template

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Checking prerequisites..."

# Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: node is not installed. Install Node.js >= 18 and re-run." >&2
  exit 1
fi

NODE_MAJOR="$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 is required (found $(node --version))." >&2
  exit 1
fi

# pandoc
if ! command -v pandoc &>/dev/null; then
  echo "WARNING: pandoc is not installed. PDF and Confluence conversion will fail." >&2
  echo "         Install it from https://pandoc.org/installing.html" >&2
  apt-get install -y pandoc || true
fi

# xelatex + required LaTeX packages for eisvogel template
if ! command -v xelatex &>/dev/null; then
  echo "==> Installing TeX Live (xelatex + required packages)..."
  apt-get install -y \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra
elif ! kpsewhich sourcesanspro.sty &>/dev/null; then
  echo "==> Installing missing TeX Live font/LaTeX packages..."
  apt-get install -y \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra
fi

# eisvogel template
TEMPLATE_PATH="/usr/share/pandoc/data/templates/"
if [ ! -f "$TEMPLATE_PATH/eisvogel.latex" ]; then
  echo "WARNING: eisvogel pandoc template not found. PDF conversion will fail." >&2
  echo "         Install it from GitHub" >&2

  wget https://github.com/Wandmalfarbe/pandoc-latex-template/releases/download/v3.4.0/Eisvogel-3.4.0.tar.gz -O /tmp/eisvogel.tar.gz
  tar -xzf /tmp/eisvogel.tar.gz -C /tmp
  mkdir -p "$TEMPLATE_PATH"
  mv /tmp/Eisvogel-3.4.0/eisvogel.latex "$TEMPLATE_PATH"
  rm -rf /tmp/Eisvogel-3.4.0 /tmp/eisvogel.tar.gz
  echo "    Installed eisvogel template to $TEMPLATE_PATH"
fi

echo "==> Installing npm dependencies..."
cd "$REPO_DIR"
npm install

echo "==> Linking CLI globally via npm..."
npm link

echo ""
echo "Installation complete."
echo "Run 'markdown-report --help' to get started."
