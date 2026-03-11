# Wallet loads nothing – use Vite dev server (Windows)

If http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/#/wallet loads nothing, run the **Vite dev server from Windows** so the UI doesn't depend on WSL↔Windows networking:

## 1. In WSL – start replica

```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
dfx start --background
```

Wait ~5 seconds for the replica to be ready.

## 2. In PowerShell (Run as Administrator) – port proxy

```powershell
$ip = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL IP: $ip"
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=4943 2>$null
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=$ip connectport=4943
```

## 3. In PowerShell – run frontend

```powershell
cd r:\REPOSITORIES\ic-launchpad\frontend
npm run dev
```

## 4. Open in browser

http://localhost:5173/#/wallet

The UI is served by Node on Windows (localhost:5173), so it loads reliably. Canister calls use 127.0.0.1:4943 via the port proxy.

If canister calls fail, the Wallet page still loads; balance may show "—" and some actions won't work until the proxy/replica are correct.
