# Deploy Launchpad to Mainnet

## Cycle costs (low for this app)

| Item | Cost |
|------|------|
| **Assets canister** (frontend) | ~0.5–1.3 T cycles to create (~$0.70–$1.80) |
| **Storage** (~1 MB) | ~\$0.005/year |
| **Ongoing burn** | ~0.01–0.1 T/month for low traffic |
| **1 T cycles** | ≈ 1 XDR ≈ ~\$1.40 (ICP→cycles conversion) |

**Total first-time:** ~\$1–2 in cycles to create and top up the frontend canister.  
**Ongoing:** A few cents per month for a low-traffic dashboard.

The wallet and registry canisters are larger if you create them; if you already have them deployed, you only pay for the **frontend** deployment.

## Deploy from Cursor (WSL terminal)

1. In Cursor: **Terminal → New Terminal** and choose **WSL** (Ubuntu) if available.
2. Run (adjust path if your repo is elsewhere):
   ```bash
   cd /mnt/r/REPOSITORIES/ic-launchpad   # R: drive → /mnt/r
   npm run deploy:frontend
   ```
3. Open the printed URL (e.g. `https://xxxxx.ic0.app`). Internet Identity works from that origin.

If dfx is not installed in WSL, install the [IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install).

## Deploy from Cursor (MCP)

If `dfx` is in your PATH (e.g. in WSL or after installing the IC SDK):

1. Build first: run `npm run build` in `ic-launchpad` (from a terminal where dfx works).
2. In Cursor chat, ask to use the `launchpad_deploy` tool with:
   - `project_path`: `r:/REPOSITORIES/ic-launchpad`
   - `canister_name`: `launchpad_frontend`
   - `network`: `ic`
   - `mode`: `upgrade`

The MCP runs `dfx deploy launchpad_frontend --network ic` for you.

## Minimizing cycle use

- **Deploy only the frontend** if wallet/registry already exist: `launchpad_frontend` only.
- **Avoid full reinstall** unless needed: use `--mode upgrade`.
- **Use the cycles ledger** for top-ups: `dfx cycles top-up <canister_id> <amount> --network ic`.
- **Keep assets small**: The build is ~550 KB; no extra optimization needed.
