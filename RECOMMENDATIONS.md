# ICP Launchpad — Recommendations & Extensions

Ideas to make the Launchpad more versatile, using what you’ve built and what’s in your repos.

---

## 1. Debug fixes (done)

- **Deploy & Canisters** — Buttons and flows are guarded when wallet/registry canister IDs are missing; setup message and Docs link are shown.
- **Top-up** — Invalid Principal and malformed cycles input are handled without crashing; top-up button disabled when canisters aren’t configured.
- **Integrations canister** — New canister stores linked accounts per principal; optional so the app works without it.

---

## 2. Connected accounts (done)

- **Integrations page** — Link external accounts (Google, X, Instagram, TikTok, YouTube, Discord, GitHub, Twitch, LinkedIn) to your Launchpad identity.
- **Google** — Connect with Google Identity Services (GIS). Set `VITE_GOOGLE_CLIENT_ID` and add the GIS script in `index.html` (already added).
- **Others** — “OAuth setup” links to each provider’s docs; full connect needs an OAuth app and (for most) a small backend to exchange code for tokens and then call the integrations canister.

---

## 3. Repos you can plug in

| Repo | Use for Launchpad |
|------|--------------------|
| **tiktok-business-api-sdk** | TikTok OAuth + API: use JS/Python SDK in a small backend or serverless function; after auth, call Launchpad `link("tiktok", user_id, username)`. |
| **ic-mcp** | Already used for deploy from Cursor. Add MCP tools: `launchpad_list_integrations`, `launchpad_link_account` (e.g. for CI or scripts). |
| **bonsai-desktop-widget / ic-canister-client.js** | Pattern for frontend ↔ canister (agent, II). Reuse for any new Launchpad canister the frontend talks to. |
| **enchanted-bonsai-bazaar** | Shopify/payments patterns. Optional: “Pay with ICP” or “Subscribe with cycles” for Launchpad add-ons later. |
| **icp-tokens-dapp** | Token/portfolio UI and DEX hooks. Optional: show ICP balance or “Convert ICP → cycles” right in the Launchpad wallet page. |
| **guardian** | If it has auth or identity logic, consider a shared “identity hub” that Launchpad and Guardian both use. |

---

## 4. More providers (beyond Google)

To support **X, Instagram, TikTok, YouTube, Discord, GitHub, Twitch, LinkedIn** with real “Connect”:

1. **Create an OAuth app** in each provider’s dev console (client ID, client secret, redirect URI).
2. **Backend** (small Node/Cloudflare Worker/Vercel route) that:
   - Serves the redirect URI.
   - Exchanges `code` for tokens.
   - Reads user id and name from the provider API.
   - Returns them to the frontend (or calls the integrations canister from the backend with the user’s II principal if you pass it securely).
3. **Frontend** — “Connect” opens the provider’s OAuth URL; after redirect, frontend calls `link(provider, external_id, username)` (or the backend does it and redirects back to the app).

You can host one small “auth bridge” service that handles all of them and only talks to the Launchpad integrations canister.

---

## 5. Versatility ideas

- **Deploy notifications** — When a deploy finishes (from MCP or UI), optionally post to a connected account (e.g. X, Discord) if the user has linked one.
- **Multi-identity** — Let the user add multiple II or “linked” identities to the same Launchpad profile so canisters can be shared or scoped per identity.
- **Templates** — “Deploy from template” (static site, Motoko API, agent) with one click; templates live in the repo or in a canister.
- **Cycles from tokens** — In the wallet page, “Convert ICP → cycles” using the NNS/cycles ledger (or a frontend that triggers the conversion and then sends cycles to the Launchpad wallet).
- **OISY / wallet connect** — Show ICP balance and send/receive via OISY or another wallet that supports the IC; keep Launchpad as the cycles wallet and canister manager.
- **Agent registry** — A canister that lists “agents” (by canister ID, name, Candid); deploy from Cursor by name (e.g. “deploy agent twitter-bot”).
- **Docs in the app** — You already have `/docs`; add a “Templates” and “Integrations” doc section that mirrors this RECOMMENDATIONS file.

---

## 6. Env checklist

For a full local/mainnet setup:

- `VITE_LAUNCHPAD_WALLET_CANISTER_ID`
- `VITE_LAUNCHPAD_REGISTRY_CANISTER_ID`
- `VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID`
- `VITE_USE_MAINNET_II=true` (optional, for local app + mainnet II)
- `VITE_GOOGLE_CLIENT_ID` (optional, for Connect with Google)
- `VITE_II_CANISTER_ID` (optional, for local II)

After `dfx deploy`, copy the new canister IDs into `frontend/.env` (and run `./scripts/run-local.sh` for local to write them automatically).
