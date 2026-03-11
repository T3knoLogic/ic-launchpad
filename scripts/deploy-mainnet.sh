#!/usr/bin/env bash
# Deploy ic-launchpad to mainnet (IC).
# Prerequisites: 4+ ICP converted to cycles (dfx cycles convert --amount 4 --network=ic)
# Run in WSL: ./scripts/deploy-mainnet.sh

set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "=== ic-launchpad Mainnet Deployment ==="
echo ""

# Check dfx
if ! command -v dfx &>/dev/null; then
  echo "ERROR: dfx not found. Install IC SDK:"
  echo "  sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
  exit 1
fi

# Check cycles balance
echo "Checking cycles balance..."
CYCLES=$(dfx cycles balance --network=ic 2>/dev/null | head -1 || echo "0 TC")
echo "Cycles: $CYCLES"
echo ""

# Check cycles - recommend 6+ TC
echo "  (Need ~6 T cycles for full deploy. Run: dfx cycles convert --amount 4 --network=ic)"

# Build frontend
echo "1. Building frontend..."
cd frontend
npm run build
cd ..
echo ""

# Deploy all canisters
echo "2. Deploying canisters to mainnet..."
dfx deploy --network ic
echo ""

# Sync env
echo "3. Syncing frontend/.env..."
node scripts/sync-env.mjs
echo ""

# Output URLs
WALLET_ID=$(dfx canister id launchpad_wallet --network ic 2>/dev/null || true)
REGISTRY_ID=$(dfx canister id launchpad_registry --network ic 2>/dev/null || true)
FRONTEND_ID=$(dfx canister id launchpad_frontend --network ic 2>/dev/null || true)

echo "=== Deployed ==="
echo "Launchpad Wallet:  $WALLET_ID"
echo "Launchpad Registry: $REGISTRY_ID"
echo "Launchpad Frontend: $FRONTEND_ID"
echo ""
echo ">>> Frontend URL: https://${FRONTEND_ID}.ic0.app <<<"
echo ""
echo "Add these to .env.local and run: node ../../scripts/env-sync.js"
