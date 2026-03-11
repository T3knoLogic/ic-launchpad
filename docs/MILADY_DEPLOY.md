# Milady on ICP — Full Deployment Guide

## Current Status ✓

- **Milady app**: https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io/
- **API canister**: https://uf5nc-hyaaa-aaaau-afpua-cai.icp0.io (hosted on IC)
- **dfx**: Use `export PATH=/home/xkpnx/.local/share/dfx/bin:$PATH` in WSL

## Quick Deploy (WSL)

```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
export PATH=/home/xkpnx/.local/share/dfx/bin:$PATH
export DFX_WARNING=-mainnet_plaintext_identity
dfx deploy milady_launchpad --network ic
```

## Install dfx (WSL, one-time)

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
dfx --version
```

## Permanent API Hosting

The current API uses a **localtunnel** URL that changes when processes restart. For production:

### Option A: Render (free, no card)

1. Push `ic-launchpad` to GitHub
2. [Render Dashboard](https://dashboard.render.com) → New → Web Service
3. Connect repo, set **Root Directory** to `milady-api`
4. Add env: `MILADY_ALLOWED_ORIGINS` = `https://YOUR-CANISTER-ID.icp0.io`
5. Deploy → copy URL (e.g. `https://milady-api-icp.onrender.com`)
6. Rebuild frontend:
   ```bash
   MILADY_API_BASE=https://milady-api-icp.onrender.com bash scripts/build-milady-for-icp.sh
   ```
7. Redeploy canister (WSL): `DFX_WARNING=-mainnet_plaintext_identity dfx deploy milady_launchpad --network ic`

### Option B: Fly.io (requires billing)

```bash
cd milady-api
fly launch --copy-config --name milady-api-icp -y
fly secrets set MILADY_ALLOWED_ORIGINS="https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io"
fly deploy
```

### Option C: Vercel (free)

```bash
cd milady-api
npx vercel login   # one-time
npx vercel --prod
# Add env vars in Vercel dashboard
```

## Keep API + Tunnel Running (temporary testing)

Run in two terminals:

**Terminal 1 — API:**
```powershell
cd r:\REPOSITORIES\ic-launchpad\milady-api
$env:MILADY_ALLOWED_ORIGINS="https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io"
node server.js
```

**Terminal 2 — Tunnel:**
```powershell
npx localtunnel --port 3000
# Note the URL (e.g. https://something.loca.lt)
# Rebuild with: $env:MILADY_API_BASE="https://that-url"; node scripts/inject-milady-api-base.js
# (Or re-run full build with that URL)
```

## Keep API Canister Warm (Heartbeat)

IC canisters can cold-start when idle. A heartbeat pings the API every 5 minutes:

**GitHub Actions** (automatic when pushed to GitHub):
- `.github/workflows/milady-api-heartbeat.yml` runs on schedule
- Push to GitHub to enable

**Manual / cron:**
```bash
# Every 5 min via crontab: */5 * * * * /path/to/scripts/milady-api-heartbeat.sh
bash scripts/milady-api-heartbeat.sh
```

## Milady Canister URL

After deploy: **https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io**
