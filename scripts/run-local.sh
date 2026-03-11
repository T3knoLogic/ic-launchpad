#!/usr/bin/env bash
# Run Launchpad locally: start replica, deploy canisters, write frontend/.env, then you run the frontend.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "=== ICP Launchpad – local setup ==="

if ! command -v dfx &>/dev/null; then
  echo "Error: dfx not found. Install the IC SDK (e.g. https://internetcomputer.org/docs/current/developer-docs/setup/install)."
  exit 1
fi

echo "Starting local replica..."
dfx start --background --clean 2>/dev/null || true
sleep 2

echo "Deploying canisters (network: local)..."
dfx deploy --network local

WALLET=$(dfx canister id launchpad_wallet --network local)
REGISTRY=$(dfx canister id launchpad_registry --network local)
INTEGRATIONS=$(dfx canister id launchpad_integrations --network local 2>/dev/null || true)

ENV_FILE="$ROOT/frontend/.env"
echo "VITE_LAUNCHPAD_WALLET_CANISTER_ID=$WALLET"  > "$ENV_FILE"
echo "VITE_LAUNCHPAD_REGISTRY_CANISTER_ID=$REGISTRY" >> "$ENV_FILE"
[ -n "$INTEGRATIONS" ] && echo "VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID=$INTEGRATIONS" >> "$ENV_FILE"

# If you have Internet Identity deployed locally, set its canister id:
# echo "VITE_II_CANISTER_ID=<your-ii-canister-id>" >> "$ENV_FILE"

echo ""
echo "Canister IDs written to $ENV_FILE"
echo "  Wallet:  $WALLET"
echo "  Registry: $REGISTRY"
[ -n "$INTEGRATIONS" ] && echo "  Integrations: $INTEGRATIONS"
echo ""
# Also sync via node (handles Windows path when run from WSL)
(cd "$ROOT" && node scripts/sync-env.mjs 2>/dev/null) || true
echo ""
echo "Start the dashboard:"
echo "  cd frontend && npm install && npm run dev"
echo ""
echo "Then open http://localhost:5173 and log in with Internet Identity."
echo "For local II, deploy the internet-identity canister and add VITE_II_CANISTER_ID to frontend/.env"
echo ""
