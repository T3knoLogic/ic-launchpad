# Launchpad Bridge

Deploy this service so **Income** and **Secrets** work from the mainnet Bonsai Ecosystem Launchpad (https://...icp0.io). Browsers block HTTPS pages from accessing HTTP localhost, so the deployed app cannot reach your local agent. The bridge runs on your own infra and holds your API tokens.

## Deploy to Render (recommended)

1. Fork or push this repo, or connect your GitHub.
2. In Render: **New → Web Service**. Connect `ic-launchpad/launchpad-bridge` (or the repo containing it).
3. Build: `cd launchpad-bridge && npm install`
4. Start: `npm start`
5. **Environment variables** (in Render dashboard):
   - `BRIDGE_API_KEY` — Strong random secret (e.g. `openssl rand -hex 32`). The Launchpad sends this to authenticate.
   - `GUMROAD_ACCESS_TOKEN` — From [Gumroad](https://gumroad.com/settings/advanced) for Income.
   - `SHOPIFY_ACCESS_TOKEN` — Shopify Admin API token.
   - `SHOPIFY_DOMAIN` — e.g. `your-store.myshopify.com` for Bazaar/Shopify Income.
   - `LAUNCHPAD_SESSION_SECRET` — HMAC secret for wallet auth challenge/session tokens.
   - `LAUNCHPAD_ALLOWED_ORIGINS` — Comma-separated allowlist for Launchpad frontends.
   - One provision/apply integration mode:
     - `LAUNCHPAD_PROVISION_WEBHOOK_URL` / `LAUNCHPAD_TOPUP_APPLY_WEBHOOK_URL`, or
     - `LAUNCHPAD_PROVISION_SCRIPT` / `LAUNCHPAD_TOPUP_APPLY_SCRIPT`, or
     - `LAUNCHPAD_ALLOW_MOCK_PROVISION=true` (dev only).
6. After deploy, copy your service URL (e.g. `https://launchpad-bridge-xxx.onrender.com`).

## Configure in Launchpad

1. Open **Integrations** (or **Income** / **Secrets**).
2. Enter **Bridge URL** (e.g. `https://your-bridge.onrender.com`) and **API key** (same as `BRIDGE_API_KEY`).
3. Save. Income and Secrets will use the bridge when accessed from mainnet.

## Local development

```bash
cd launchpad-bridge
npm install
BRIDGE_API_KEY=test-key GUMROAD_ACCESS_TOKEN=your-token npm run dev
```

## Endpoints

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/health` | GET | None | Connectivity check |
| `/api/income` | GET | X-Bridge-Key | Gumroad + Shopify data |
| `/secrets` | GET | X-Bridge-Key | Read stored secrets |
| `/secrets` | POST | X-Bridge-Key | Save secrets (persists on Render/Railway/Fly) |
| `/api/launchpad/auth/challenge` | POST | None | Creates wallet auth challenge |
| `/api/launchpad/auth/verify` | POST | None | Verifies signature + returns session token |
| `/api/launchpad/rates/icp-per-tcycles` | POST | None | Returns ICP per 1T cycles from CMC (DFINITY source) |
| `/api/launchpad/canister/provision` | POST | Launchpad session / X-Bridge-Key | Provisions user-owned canister |
| `/api/launchpad/cycles/topup-intent` | POST | Launchpad session / X-Bridge-Key | Creates top-up intent with quotas + idempotency |
| `/api/launchpad/cycles/topup-finalize` | POST | Launchpad session / X-Bridge-Key | Finalizes funded intent, applies top-up |
| `/api/launchpad/intents/:intentId` | GET | Launchpad session / X-Bridge-Key | Fetches intent status |

CORS allows `*.ic0.app` and `*.icp0.io` origins.

## Wallet proof contract

`/api/launchpad/auth/verify` expects:

- `challenge_id`
- `principal`
- `wallet_kind` (`plug` or `oisy`)
- `proof`:
  - `alg`: `ed25519` or `ecdsa`
  - `public_key_pem`
  - `signature_b64` (signature over returned challenge string)

Server derives a self-authenticating principal from `public_key_pem` and requires it to match `principal`.

## Reference worker scripts (on-chain provision + top-up)

The repo includes bash scripts that call **`launchpad_wallet`** on mainnet (`create_canister_with_cycles` / `top_up`), same pattern as `scripts/topup-canister-from-launchpad-wallet.sh`.

- **Provision**: `../scripts/launchpad-provision-canister.sh` — creates an empty canister with controllers `[user principal, launchpad_wallet]`.
- **Apply top-up**: `../scripts/launchpad-apply-topup.sh` — sends cycles from `launchpad_wallet` to the user’s canister (chunked in 5 TC steps).

### Bridge env (production)

Set **one string** that splits on spaces into `command` + args (see `server.js`). Typical pattern:

```bash
LAUNCHPAD_PROVISION_SCRIPT=bash /path/to/ic-launchpad/scripts/launchpad-provision-canister.sh
LAUNCHPAD_TOPUP_APPLY_SCRIPT=bash /path/to/ic-launchpad/scripts/launchpad-apply-topup.sh
```

Run the Node process on a host that has **`dfx`** on `PATH` and an identity that **controls `launchpad_wallet`** (same as your existing cycle ops).

Optional overrides:

- `LAUNCHPAD_WALLET_CANISTER_ID` — default `tw5ow-tiaaa-aaaau-afpha-cai`
- `NETWORK` — default `ic`
- `LAUNCHPAD_IC_HOST` — default `https://icp0.io` (used for CMC rate query)
- `LAUNCHPAD_CMC_CANISTER_ID` — default `rkp4c-7iaaa-aaaaa-aaaca-cai`
- `LAUNCHPAD_ICP_PER_TCYCLES_OVERRIDE` — optional manual rate override (decimal ICP per 1T cycles)

### Operational notes

- **Identity**: `dfx identity use …` must match a controller of `launchpad_wallet` before starting the bridge process (or set `DFX_IDENTITY` if your dfx supports it).
- **Amounts**: `LAUNCHPAD_REQUESTED_CYCLES_T` / cycle fields are **decimal trillion-cycles (TC)**; scripts convert with `× 10^12` (see `scripts/cycle-lib.sh`).
- **ICP Ledger verification (optional)**: Set `LAUNCHPAD_LEDGER_VERIFY=true` so `topup-finalize` checks the transfer **before** running `LAUNCHPAD_TOPUP_APPLY_SCRIPT`.
  - `tx_hash` must be the **ledger block index** (decimal string).
  - Set `LAUNCHPAD_LEDGER_DEPOSIT_ACCOUNT_HEX` to the **32-byte account id** (64 hex chars) that receives user ICP.
  - Top-up intents include `memo_nat` (uint64): users must set the ICP transfer **memo** to this value (ICP Ledger `send` uses `nat64` memo).
  - Optional: `LAUNCHPAD_LEDGER_HOST`, `LAUNCHPAD_LEDGER_CANISTER_ID`, `LAUNCHPAD_MIN_DEPOSIT_E8S` (default `10000`).
