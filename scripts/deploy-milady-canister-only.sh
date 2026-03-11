#!/usr/bin/env bash
# Deploy only the Milady canister (assets must already be built in milady-assets/dist).
# Use when MILADY_API_BASE was injected via: MILADY_API_BASE=... bash scripts/build-milady-for-icp.sh
# Run from ic-launchpad (in WSL): bash scripts/deploy-milady-canister-only.sh
set -e
export DFX_WARNING=-mainnet_plaintext_identity
cd "$(dirname "$0")/.."
dfx deploy milady_launchpad --network ic
echo "Done. Milady: https://$(dfx canister id milady_launchpad --network ic).icp0.io"
