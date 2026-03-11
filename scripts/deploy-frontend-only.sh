#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity
cd /mnt/r/REPOSITORIES/ic-launchpad
echo "Deploying frontend..."
dfx deploy launchpad_frontend --network ic
echo "Syncing env..."
node scripts/sync-env.mjs
echo "Done. URL: https://$(dfx canister id launchpad_frontend --network ic).ic0.app"
