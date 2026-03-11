#!/bin/bash
# Install dfx in WSL. Run: wsl bash scripts/install-dfx-wsl.sh
set -e
if command -v dfx &>/dev/null; then
  echo "dfx already installed: $(dfx --version)"
  exit 0
fi
echo "Installing dfx..."
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
echo "Done. dfx --version:"
dfx --version
