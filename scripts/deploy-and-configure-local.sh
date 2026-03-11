#!/usr/bin/env bash
# Deploy Launchpad canisters locally and configure Cursor MCP with canister IDs.
# Uses dfx 0.15.1 for compatibility with existing Motoko code.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/share/dfx/bin:$PATH"
source "$HOME/.local/share/dfx/env" 2>/dev/null || true

# Use dfx 0.15.1 (compatible with project)
dfxvm use 0.15.1 2>/dev/null || true

if ! command -v dfx &>/dev/null; then
  echo "Error: dfx not found. Install the IC SDK first:"
  echo "  sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
  exit 1
fi

echo "=== Deploying canisters (network: local) ==="
dfx start --background --clean 2>/dev/null || true
sleep 2
dfx deploy --network local

echo ""
echo "=== Syncing env to frontend and Cursor MCP ==="
node scripts/sync-env.mjs

WALLET=$(dfx canister id launchpad_wallet --network local)
REGISTRY=$(dfx canister id launchpad_registry --network local)
echo ""
echo "Done. Local canister IDs:"
echo "  Wallet:  $WALLET"
echo "  Registry: $REGISTRY"
echo ""
echo "Restart Cursor (or reload window) for MCP to pick up the config."
