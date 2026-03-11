#!/usr/bin/env bash
# Run Vite dev server in WSL. Access from Windows: http://localhost:5173
# WSL2 forwards localhost; canister API calls go to 127.0.0.1:4943 (needs port proxy).
export PATH="$HOME/.local/share/dfx/bin:$PATH"
cd /mnt/r/REPOSITORIES/ic-launchpad
# Start replica in background if not running
dfx ping 2>/dev/null || { dfx start --background; sleep 5; }
cd frontend && npm run dev -- --host
