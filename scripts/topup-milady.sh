#!/usr/bin/env bash
# Top up Milady canister with cycles from Launchpad Wallet.
# Run from ic-launchpad: bash scripts/topup-milady.sh
# Requires: dfx, identity that controls Launchpad Wallet.

set -e

export DFX_WARNING=-mainnet_plaintext_identity

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

WALLET_ID="tw5ow-tiaaa-aaaau-afpha-cai"
MILADY_ID="q2k6b-yiaaa-aaaau-afpna-cai"
AMOUNT="1000_000_000_000"

echo "=== Top up Milady canister ==="
echo "Canister: $MILADY_ID"
echo "Amount: $AMOUNT cycles (1T)"
echo ""

dfx canister call "$WALLET_ID" top_up --argument-file .topup-milady-arg.txt --network ic

echo ""
echo "Done. Milady should be unfrozen in a few seconds."
echo "URL: https://${MILADY_ID}.icp0.io"
