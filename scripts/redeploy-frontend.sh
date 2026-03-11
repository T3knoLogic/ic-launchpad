#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity
cd /mnt/r/REPOSITORIES/ic-launchpad
node scripts/sync-env.mjs
cd frontend && npm run build && cd ..
dfx deploy launchpad_frontend --network ic
echo "Done. https://$(dfx canister id launchpad_frontend --network ic).ic0.app"
