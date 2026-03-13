#!/bin/bash
# Build valuation roadmap assets for ICP deployment.
# Copies HTML + images from REPOSITORIES into valuation-roadmap-assets/dist.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$IC_ROOT/.." && pwd)"

DIST="$IC_ROOT/valuation-roadmap-assets/dist"
ASSETS="$DIST/assets"
mkdir -p "$ASSETS"

echo "Building valuation roadmap assets..."
# Copy HTML
cp "$REPO_ROOT/BONSAI_VALUATION_GROWTH_ROADMAP.html" "$DIST/index.html"
# Copy images
cp "$REPO_ROOT/assets/bonsai-ecosystem-infrastructure.png" "$ASSETS/"
cp "$REPO_ROOT/assets/bonsai-new-tools-inventory.png" "$ASSETS/"
cp "$REPO_ROOT/assets/bonsai-valuation-path.png" "$ASSETS/"
cp "$REPO_ROOT/assets/bonsai-priority-matrix.png" "$ASSETS/"

echo "Done. Output: $DIST"
echo "Deploy: dfx deploy valuation_roadmap --network ic"
