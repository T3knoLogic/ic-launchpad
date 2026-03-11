#!/usr/bin/env bash
# Deploy Launchpad locally (uses dfx 0.30).
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
source "$HOME/.local/share/dfx/env" 2>/dev/null || true
cd /mnt/r/REPOSITORIES/ic-launchpad
dfx stop 2>/dev/null || true
sleep 2
dfx start --background --clean
sleep 5
dfx deploy --network local
node scripts/sync-env.mjs
echo "Done. Restart Cursor for MCP to pick up config."
