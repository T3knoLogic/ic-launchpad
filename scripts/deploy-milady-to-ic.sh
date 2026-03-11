#!/usr/bin/env bash
# Deploy Milady to IC mainnet and update Launchpad frontend.
# Prerequisites: dfx, sufficient cycles, identity configured.
# Run from ic-launchpad: bash scripts/deploy-milady-to-ic.sh
#
# If you get "Insufficient cycles balance":
#   dfx cycles convert --amount=0.1 --network ic
#   (or top up via your wallet)
set -e

export DFX_WARNING=-mainnet_plaintext_identity

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== 1. Build Milady assets ==="
bash scripts/build-milady-for-icp.sh

echo ""
echo "=== 2. Deploy milady_launchpad canister to IC ==="
dfx deploy milady_launchpad --network ic

echo ""
echo "=== 3. Sync canister IDs to frontend ==="
node scripts/sync-env.mjs

echo ""
echo "=== 4. Build and deploy Launchpad frontend ==="
cd frontend
npm run build
cd ..
dfx deploy launchpad_frontend --network ic

echo ""
echo "=== Done! Milady is live. ==="
MILADY_ID=$(grep CANISTER_ID_MILADY .env 2>/dev/null | cut -d= -f2 || dfx canister id milady_launchpad --network ic)
echo "Milady URL (use icp0.io): https://${MILADY_ID}.icp0.io"
echo "Launchpad: https://$(dfx canister id launchpad_frontend --network ic).ic0.app"
