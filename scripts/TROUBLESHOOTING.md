# Launchpad won't load – troubleshooting

If the frontend at http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/ doesn't load:

## 1. Start replica and port proxy (run as Administrator)

```powershell
.\scripts\start-all.ps1
```

## 2. Manual steps (if script fails)

**In WSL (Ubuntu) terminal:**

```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
dfx stop
sleep 2
dfx start --background
```

Wait ~5 seconds, then in **PowerShell (Run as Administrator):**

```powershell
# Get WSL IP
$ip = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL IP: $ip"

# Set port proxy
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=4943
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=$ip connectport=4943
```

## 3. Alternative: Vite dev server (run from Windows)

If the deployed frontend won't load, run Vite **from Windows** so you don't rely on WSL↔Windows UI:

1. **In WSL** – start replica:
   ```bash
   cd /mnt/r/REPOSITORIES/ic-launchpad
   dfx start --background
   ```

2. **In PowerShell (Admin)** – set port proxy:
   ```powershell
   $ip = (wsl hostname -I).Trim().Split()[0]
   netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=$ip connectport=4943
   ```

3. **In PowerShell** – run frontend:
   ```powershell
   cd r:\REPOSITORIES\ic-launchpad\frontend
   npm run dev
   ```

4. Open **http://localhost:5173/#/wallet** in your browser.

The UI is served by Node on Windows, so it loads without WSL networking. Canister calls use 127.0.0.1:4943 and go through the port proxy to the replica.

## 4. "Invalid delegation" / "IcCanisterSignature could not be verified"

This means your cached II session was created for a different network than the one you're calling. Delegations are bound to one network.

**Fix:** Log out, then log in again. The app will create a fresh delegation for the current network.

**Network switch:** In `frontend/.env`, set `VITE_NETWORK=mainnet` (deploy to IC) or `VITE_NETWORK=local` (test against local replica). Restart dev server after changing.

## 5. WSL networking issues

If connection keeps timing out or closing:

1. Restart WSL: `wsl --shutdown` (in PowerShell), then start a new WSL terminal
2. Re-run start-all.ps1 or the manual steps above
3. Verify firewall: Port 4943 should be allowed (scripts add a rule)
