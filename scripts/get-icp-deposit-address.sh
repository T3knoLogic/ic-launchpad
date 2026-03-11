#!/usr/bin/env bash
# Get ICP deposit address (ledger account-id) for your dfx identity.
# Run in WSL: ./scripts/get-icp-deposit-address.sh
# Send ICP to this address from an exchange (Binance, Coinbase, etc.)

set -e
export PATH="$HOME/.local/share/dfx/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== ICP Deposit Address for ic-launchpad Deployment ==="
echo ""

# Ensure dfx exists
if ! command -v dfx &>/dev/null; then
  echo "ERROR: dfx not found. Install IC SDK in WSL:"
  echo "  sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
  exit 1
fi

# Show current identity
IDENTITY=$(dfx identity whoami 2>/dev/null || echo "default")
echo "Identity: $IDENTITY"
echo "Principal: $(dfx identity get-principal 2>/dev/null)"
echo ""

# Ledger account-id: send ICP to this address
echo ">>> SEND ICP TO THIS ADDRESS (ledger account-id): <<<"
echo ""
dfx ledger account-id
echo ""
echo ">>> COPY THE 64-CHARACTER HEX STRING ABOVE <<<"
echo ""
echo "On some exchanges, you may need to use:"
echo "  - Network: Internet Computer (ICP)"
echo "  - Address: the hex string above"
echo "  - Memo: (usually not required for main account)"
echo ""
echo "Recommended: 4 ICP for deployment (at ~\$2.45/ICP)"
echo "After deposit: dfx ledger balance --network=ic"
