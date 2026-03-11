# Local frontend startup

Nothing loads at `http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/` when:

1. **The replica is not running** — the dfx replica must be started in WSL
2. **Windows doesn't resolve `*.localhost`** — add a hosts entry
3. **WSL2 isolation** — port proxy and `0.0.0.0` bind needed for Windows → WSL access

## 1. Start the replica (WSL)

In a **WSL Ubuntu** terminal:

```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
./scripts/start-replica.sh
```

Or: `dfx start --background`. The replica binds to `0.0.0.0:4943` for WSL→Windows access.

## 2. Port proxy (Windows, run as Administrator)

WSL2 isolates network; Windows can't reach replica on 127.0.0.1 inside WSL. Forward port 4943:

```powershell
# Run in elevated PowerShell:
.\scripts\setup-portproxy.ps1
```

Or manually (replace WSL_IP with `wsl hostname -I` result):

```powershell
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=4943 connectaddress=WSL_IP connectport=4943
```

Re-run after reboot if WSL IP changes.

## 4. Add hosts entry (Windows, as Administrator)

Open Notepad as Administrator → File → Open →  
`C:\Windows\System32\drivers\etc\hosts`  
Add this line:

```
127.0.0.1 uxrrr-q7777-77774-qaaaq-cai.localhost
```

Save. Then use:

- **Subdomain URL:** http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/
- **Legacy URL:** http://127.0.0.1:4943/?canisterId=uxrrr-q7777-77774-qaaaq-cai

## 5. Verify

```powershell
# From Windows PowerShell (replica must be running):
Invoke-WebRequest -Uri "http://127.0.0.1:4943/?canisterId=uxrrr-q7777-77774-qaaaq-cai" -UseBasicParsing
```

If that succeeds (status 200), the frontend is reachable.
