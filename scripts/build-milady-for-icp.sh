#!/usr/bin/env bash
# Build Milady app for ICP deployment.
# Run from ic-launchpad: bash scripts/build-milady-for-icp.sh
# Requires: node/bun in PATH, milady repo at ../milady
# Output: milady-assets/dist (served by milady_launchpad canister)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$IC_ROOT/.." && pwd)"
MILADY_DIR="$REPO_ROOT/milady"
OUT_DIR="$IC_ROOT/milady-assets"

if [[ ! -d "$MILADY_DIR" ]]; then
  echo "Milady repo not found at $MILADY_DIR"
  exit 1
fi

echo "Building Milady app..."
cd "$MILADY_DIR"

# Prefer bun, fallback to node. On Windows use build:win (avoids bun/rt.sh).
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  echo "Using Node (Windows build:win)..."
  (cd "$MILADY_DIR/apps/app" && npm run build:win)
elif command -v bun &>/dev/null 2>&1; then
  echo "Using Bun..."
  bun install
  bun run build
else
  echo "Using Node (bun not found)..."
  npm install
  npm run build:node
fi

mkdir -p "$OUT_DIR/dist"
echo "Copying dist to $OUT_DIR/dist..."
rm -rf "$OUT_DIR/dist"
cp -r "$MILADY_DIR/apps/app/dist" "$OUT_DIR/"

# Add .ic-assets.json5 for gateway config (icp0.io compatibility)
if [[ -f "$IC_ROOT/milady-assets/.ic-assets.json5" ]]; then
  cp "$IC_ROOT/milady-assets/.ic-assets.json5" "$OUT_DIR/dist/"
fi

# Inject MILADY_API_BASE if set (for agent backend on ICP)
if [[ -n "$MILADY_API_BASE" ]]; then
  echo "Injecting MILADY_API_BASE=$MILADY_API_BASE"
  MILADY_API_BASE="$MILADY_API_BASE" node "$SCRIPT_DIR/inject-milady-api-base.js"
fi

echo "Done. Milady assets in $OUT_DIR/dist"
echo "Deploy: dfx deploy milady_launchpad --network ic"
