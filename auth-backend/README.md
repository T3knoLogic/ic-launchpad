# Launchpad auth backend

OAuth callback server for **GitHub** and **Discord** (and optionally **Google**). Exchanges the auth code for tokens, fetches user id/name, then redirects to the Launchpad frontend with `?linked=provider&external_id=...&username=...` so the frontend can call the integrations canister.

## Setup

1. Copy env and set the frontend URL:
   ```bash
   cp .env.example .env
   # Edit .env: FRONTEND_URL=http://localhost:5173 (or your frontend URL)
   ```

2. Create OAuth apps and set client ID/secret in `.env`:

   **GitHub**
   - Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → New OAuth App.
   - Application name: e.g. `ICP Launchpad`.
   - Homepage URL: `http://localhost:5173` (or your frontend).
   - Authorization callback URL: **`http://localhost:3030/auth/github/callback`** (this backend).
   - Copy Client ID and generate Client secret → set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`.

   **Discord**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application → OAuth2.
   - Redirects: add **`http://localhost:3030/auth/discord/callback`**.
   - Copy Client ID and Client secret → set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in `.env`.

   **Google (optional, via backend)**
   - [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID (Web application).
   - Authorized redirect URIs: **`http://localhost:3030/auth/google/callback`**.
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. The frontend can then use "Connect" for Google via this backend instead of the popup.

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:3030`. Ensure the Launchpad frontend has `VITE_AUTH_BACKEND_URL=http://localhost:3030` in its `.env`.

## Flow

1. User clicks **Connect** (e.g. GitHub) on the Integrations page.
2. Browser goes to `http://localhost:3030/auth/github` → backend redirects to GitHub.
3. User authorizes → GitHub redirects to `http://localhost:3030/auth/github/callback?code=...`.
4. Backend exchanges `code` for an access token, fetches user info, redirects to `FRONTEND_URL/integrations?linked=github&external_id=...&username=...`.
5. Frontend reads the params and calls the Launchpad integrations canister `link(provider, external_id, username)`.
