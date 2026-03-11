#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

ROOT="/mnt/r/REPOSITORIES/ic-launchpad"
LOG="$ROOT/deploy-logs/finish_$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$ROOT/deploy-logs"
exec > >(tee -a "$LOG") 2>&1

cd "$ROOT"
echo "=== Finish deployment $(date) ==="
echo "1. ICP balance:"
dfx ledger balance --network=ic
echo ""
echo "2. Convert 3 ICP to cycles:"
dfx cycles convert --amount 3 --network=ic
echo ""
echo "3. Cycles balance:"
dfx cycles balance --network=ic
echo ""
echo "4. Deploy launchpad_registry:"
dfx deploy launchpad_registry --network ic
echo ""
echo "5. Deploy launchpad_wallet:"
dfx deploy launchpad_wallet --network ic
echo ""
echo "6. Rebuild frontend with new canister IDs:"
cd frontend && npm run build && cd ..
echo ""
echo "7. Upgrade frontend:"
dfx deploy launchpad_frontend --network ic --mode upgrade
echo ""
echo "8. Sync env:"
node scripts/sync-env.mjs
echo ""
echo "=== Done ==="
echo "Wallet:  $(dfx canister id launchpad_wallet --network ic)"
echo "Registry: $(dfx canister id launchpad_registry --network ic)"
echo "Integrations: $(dfx canister id launchpad_integrations --network ic)"
echo "Frontend: $(dfx canister id launchpad_frontend --network ic)"
echo "URL: https://$(dfx canister id launchpad_frontend --network ic).ic0.app"
