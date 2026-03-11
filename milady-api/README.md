# Milady API for ICP Launchpad

Minimal Milady-compatible API server for the Milady frontend deployed on the Internet Computer. Serves `/api/status`, `/api/agent/*`, and `/api/chat`.

## Quick Start (Local)

```bash
cd milady-api
cp .env.example .env
# Edit .env: set MILADY_ALLOWED_ORIGINS=https://YOUR-CANISTER-ID.icp0.io
npm install
npm start
```

Then build the frontend with the API URL and deploy:

```bash
MILADY_API_BASE=http://localhost:3000 bash scripts/build-milady-for-icp.sh
```

## Deploy to Render (Free Tier)

1. Push `ic-launchpad` to GitHub (or ensure `milady-api` is in a repo).
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Web Service.
3. Connect your repo. Set **Root Directory** to `milady-api`.
4. Add environment variables:
   - `MILADY_ALLOWED_ORIGINS` = `https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io` (or your canister URL)
   - `GROQ_API_KEY` (optional) = get free key at [console.groq.com](https://console.groq.com)
5. Deploy. You'll get a URL like `https://milady-api-icp.onrender.com`.

## Deploy to Railway

```bash
cd milady-api
npm i -g @railway/cli
railway login
railway init
railway up
```

Set env vars in the Railway dashboard. Copy the public URL.

## Wire Frontend to API

After the API is running and you have its URL:

```bash
# From ic-launchpad root
MILADY_API_BASE=https://your-api.onrender.com bash scripts/build-milady-for-icp.sh
# Then deploy the Milady canister (from WSL)
DFX_WARNING=-mainnet_plaintext_identity dfx deploy milady_launchpad --network ic
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `MILADY_ALLOWED_ORIGINS` | For production | Comma-separated CORS origins. `*.icp0.io` is always allowed. |
| `GROQ_API_KEY` | No | Groq API key for real AI. Without it, responses are echo-only. |
| `AGENT_NAME` | No | Agent display name (default: Milady) |
