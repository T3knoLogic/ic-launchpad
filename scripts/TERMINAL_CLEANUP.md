# Terminal cleanup — what to close

## Close these (stuck WSL/dfx — likely blocking new WSL terminals)

| Terminal file | What it's running | Status |
|---------------|-------------------|--------|
| 14571 | `dfx deploy milady_launchpad` | Stuck 60+ min at "Building" |
| 334287 | `dfx build` + `dfx canister install` milady | Stuck |
| 385842 | `wsl ls` (simple test) | Stuck |
| 239148 | `wsl echo` / dfx version | Stuck |
| 271427 | `wsl ls` milady-assets | Stuck |
| 633242 | `dfx canister status` | Stuck |
| 699009 | `wsl dfx --version` | Stuck |
| 940260 | `dfx canister status` | Stuck |
| 190426 | `dfx canister install` cycles_forwarder | Stuck waiting for "yes/No" input |

Close the Cursor terminals that correspond to these (or any terminal running WSL / dfx).

## Keep these (active services)

| Terminal | Service |
|----------|---------|
| 1 | Launchpad frontend — `npm run dev` (localhost:5174) |
| 33 | Launchpad local agent — `node scripts/launchpad-local-agent.js` (port 3847) |
| 618961 | ic-launchpad `npm run dev` (local + auth) |
| 271670 or 690897 | E Phunks Mod bot (keep one) |
| 277199 or 876036 | Eliza Odin Trader (keep one) |
| 532835 or 784718 | Bonsai Radio Discord bot (keep one) |
| 548597 or 594527 | E Phunks Giveaway bot (keep one) |
| 94981 | E Phunks FAQ bot |
| 74863 | Bonsai Desktop Widget — `serve` (localhost:3333) |

## One-time fix (optional)

In a fresh PowerShell (outside Cursor), run:

```powershell
wsl --shutdown
```

Wait 10 seconds, then open a new WSL terminal in Cursor. This kills all WSL processes and frees resources.
