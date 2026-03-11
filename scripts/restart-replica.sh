#!/usr/bin/env bash
export PATH="$HOME/.local/share/dfx/bin:$PATH"
cd /mnt/r/REPOSITORIES/ic-launchpad
dfx stop 2>/dev/null || true
sleep 2
dfx start --background
