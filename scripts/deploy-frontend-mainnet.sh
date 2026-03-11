#!/usr/bin/env bash
# Deploy Launchpad frontend to mainnet. Low-cost assets canister.
# Run from ic-launchpad root in WSL: ./scripts/deploy-frontend-mainnet.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "=== Deploy Launchpad frontend to mainnet ==="

if ! command -v dfx &>/dev/null; then
  echo "Error: dfx not found. Install the IC SDK in WSL: https://internetcomputer.org/docs/current/developer-docs/setup/install"
  exit 1
fi

echo "1. Building frontend..."
cd frontend
npm run build
cd ..

echo "2. Deploying launchpad_frontend to mainnet..."
dfx deploy launchpad_frontend --network ic --mode upgrade

FRONTEND_ID=$(dfx canister id launchpad_frontend --network ic)
echo ""
echo "=== Deployed ==="
echo "Frontend URL: https://${FRONTEND_ID}.ic0.app"
echo ""
echo "Open this URL to use the dashboard with Internet Identity."
