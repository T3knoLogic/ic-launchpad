# See the latest Wallet changes

The enhanced Wallet includes:
- **formatCycles** – readable formatting (1.5 T cycles, etc.)
- **Copy wallet canister ID** – one-click copy
- **Quick actions** – Deploy, Top up, Convert ICP links
- **OISY / Plug** – wallet links
- **Auto-refresh** – balance refreshes when you focus the tab
- **Improved layout** – clear sections inspired by nns-dapp, oisy, plug

## To see changes

1. **Rebuild and deploy** (in WSL):
   ```bash
   cd /mnt/r/REPOSITORIES/ic-launchpad
   ./scripts/build-frontend.sh
   ./scripts/deploy-frontend-only.sh
   ```

2. **Restart for Windows access** (PowerShell as Admin):
   ```powershell
   .\scripts\start-all.ps1
   ```

3. **Hard refresh** in the browser when on the Wallet page:
   - **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Firefox**: `Ctrl + Shift + R`

4. **Go to** http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/#/wallet

## If you still see the old Wallet

- The old Wallet has a single card with "Launchpad cycles balance" and "Refresh balance".
- The new Wallet has: "LAUNCHPAD CYCLES" header, Wallet canister ID with Copy, Quick actions, ICP wallets (OISY/Plug), Get more cycles.

If you see the old layout, the frontend canister hasn’t been redeployed yet. Run step 1 in WSL.
