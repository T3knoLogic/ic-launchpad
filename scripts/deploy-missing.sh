#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity
cd /mnt/r/REPOSITORIES/ic-launchpad
echo "Cycles: $(dfx cycles balance --network=ic)"
echo "Deploying launchpad_registry and launchpad_wallet..."
dfx deploy launchpad_registry --network ic
dfx deploy launchpad_wallet --network ic
echo "Done. Syncing env..."
node scripts/sync-env.mjs
