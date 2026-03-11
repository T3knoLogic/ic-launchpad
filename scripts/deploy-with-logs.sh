#!/usr/bin/env bash
# Deploy ic-launchpad to mainnet with full logging.
# Run: wsl bash /mnt/r/REPOSITORIES/ic-launchpad/scripts/deploy-with-logs.sh

set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

ROOT="/mnt/r/REPOSITORIES/ic-launchpad"
LOG_DIR="$ROOT/deploy-logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAIN_LOG="$LOG_DIR/deploy_${TIMESTAMP}.log"
exec > >(tee -a "$MAIN_LOG") 2>&1

cd "$ROOT"
echo "=== ic-launchpad deployment started $(date) ==="
echo "Log file: $MAIN_LOG"
echo ""

echo "--- Step 1: Check ICP balance ---"
dfx ledger balance --network=ic || true
echo ""

echo "--- Step 2: Convert ICP to cycles (4 ICP) ---"
dfx cycles convert --amount 4 --network=ic || true
echo ""

echo "--- Step 3: Verify cycles balance ---"
dfx cycles balance --network=ic || true
echo ""

echo "--- Step 4: Install frontend deps (Linux) and build ---"
cd frontend
npm install 2>&1 | tee "$LOG_DIR/npm_install_${TIMESTAMP}.log" || true
npm run build 2>&1 | tee "$LOG_DIR/build_${TIMESTAMP}.log"
cd ..
echo ""

echo "--- Step 5: Deploy canisters to mainnet ---"
dfx deploy --network ic 2>&1 | tee "$LOG_DIR/dfx_deploy_${TIMESTAMP}.log"
echo ""

echo "--- Step 6: Sync env ---"
node scripts/sync-env.mjs
echo ""

echo "--- Step 7: Output canister IDs ---"
dfx canister id launchpad_wallet --network ic 2>/dev/null || true
dfx canister id launchpad_registry --network ic 2>/dev/null || true
dfx canister id launchpad_frontend --network ic 2>/dev/null || true
echo ""

echo "=== Deployment complete $(date) ==="
echo "Logs saved in: $LOG_DIR"
