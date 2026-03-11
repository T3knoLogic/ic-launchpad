#!/usr/bin/env bash
# Create milady_api canister via Launchpad Wallet, then install code.
# Run from ic-launchpad: bash scripts/create-and-install-milady-api.sh
# Prerequisites: Launchpad Wallet has cycles, your identity is a controller.

set -e
export DFX_WARNING=-mainnet_plaintext_identity

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

WALLET_ID="tw5ow-tiaaa-aaaau-afpha-cai"
AMOUNT="1000_000_000_000"

echo "=== 1. Create canister via Launchpad Wallet (1T cycles) ==="
RESULT=$(dfx canister call "$WALLET_ID" create_canister_with_cycles "(${AMOUNT}, null)" --network ic --output raw 2>/dev/null || true)
# Parse (ok principal) or (err "msg")
if echo "$RESULT" | grep -q "ok"; then
  API_ID=$(echo "$RESULT" | grep -oE '[a-z0-9-]{25,}' | head -1)
  if [ -z "$API_ID" ]; then
    echo "Failed to parse canister ID from: $RESULT"
    exit 1
  fi
  echo "Created canister: $API_ID"
else
  echo "Create failed: $RESULT"
  exit 1
fi

echo ""
echo "=== 2. Register canister id in dfx ==="
dfx canister set-id milady_api "$API_ID" --network ic

echo ""
echo "=== 3. Build and install milady_api ==="
dfx build milady_api --network ic
dfx canister install milady_api --network ic --mode install

echo ""
echo "=== Done! Milady API is live. ==="
echo "API URL: https://${API_ID}.icp0.io"
echo "Test: curl https://${API_ID}.icp0.io/api/status"
