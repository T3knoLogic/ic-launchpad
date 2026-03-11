#!/usr/bin/env bash
export PATH="$HOME/.local/share/dfx/bin:$PATH"
cd "$(dirname "$0")/.."
echo "ICP balance:"
dfx ledger balance --network=ic 2>/dev/null || echo "  (not checked)"
echo "Cycles balance:"
dfx cycles balance --network=ic 2>/dev/null || echo "  (not checked)"
