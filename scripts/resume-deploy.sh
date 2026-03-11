#!/usr/bin/env bash
# Resume deployment - convert remaining ICP and deploy missing canisters
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

ROOT="/mnt/r/REPOSITORIES/ic-launchpad"
LOG_DIR="$ROOT/deploy-logs"
mkdir -p "$LOG_DIR"
exec >> "$LOG_DIR/resume_$(date +%Y%m%d_%H%M%S).log" 2>&1

cd "$ROOT"
echo "=== Resume deploy $(date) ==="
echo "ICP balance:"
dfx ledger balance --network=ic
echo "Converting remaining ICP..."
dfx cycles convert --amount 0.0005 --network=ic || true
echo "Cycles balance:"
dfx cycles balance --network=ic
echo "Deploying (will upgrade existing, create missing)..."
dfx deploy --network ic
echo "Sync env..."
node scripts/sync-env.mjs
echo "Canister IDs:"
dfx canister id launchpad_wallet --network ic 2>/dev/null || echo "wallet: (not created)"
dfx canister id launchpad_registry --network ic 2>/dev/null || echo "registry: (not created)"
dfx canister id launchpad_integrations --network ic 2>/dev/null || echo "integrations: (not created)"
dfx canister id launchpad_frontend --network ic 2>/dev/null || echo "frontend: (not created)"
echo "Done $(date)"
