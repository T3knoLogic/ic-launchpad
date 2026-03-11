# ICP Launchpad

Deploy apps and agents to the Internet Computer from one place. Manage canisters, hold cycles, convert ICP → cycles, and deploy from **Cursor** via natural language.

## Features

- **Wallet canister** — Hold cycles; create canisters and top them up
- **Registry canister** — Register and list your canisters by name
- **Web UI** — Login with Internet Identity; view balance, canisters, deploy
- **Cursor / MCP** — Use the Launchpad MCP server so Cursor can create canisters, top up, and run `dfx deploy` for you

## Local testing (run the dashboard on your machine)

To test the dashboard against a **local** replica and canisters (no mainnet):

1. In **WSL/bash** from the project root:  
   `./scripts/run-local.sh`  
   (starts the replica, deploys canisters, writes `frontend/.env` with local canister IDs)
2. `cd frontend && npm install && npm run dev`
3. Open http://localhost:5173

To log in without deploying Internet Identity locally, add to **frontend/.env**:  
`VITE_USE_MAINNET_II=true`  
Then restart the dev server — the app will use mainnet II but still talk to your local canisters.

Full details: **[LOCAL_TESTING.md](LOCAL_TESTING.md)**.

**Windows:** Run `.\scripts\run-local.ps1` (uses WSL for dfx, then syncs env and runs `npm run setup`).

### One-time setup & run

```bash
npm run setup          # install deps in frontend, auth-backend, mcp
npm run dev            # start frontend + auth backend together
```

---

## Quick start (WSL2 / Ubuntu)

### 1. Deploy and sync env (one command)

```bash
cd ic-launchpad
npm run deploy:local:sync   # or deploy:sync for mainnet
```

This runs `dfx deploy` and then `npm run env:sync`, which copies canister IDs from `.env` into `frontend/.env` automatically.

Or manually:

```bash
# frontend/.env (create from .env.example)
VITE_LAUNCHPAD_WALLET_CANISTER_ID=<launchpad_wallet id>
VITE_LAUNCHPAD_REGISTRY_CANISTER_ID=<launchpad_registry id>
VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID=<launchpad_integrations id>
```

### 2. Run the frontend

```bash
cd frontend
npm install
npm run build   # or use dfx deploy again to build with canister ids
npm run dev
```

Open the app, log in with Internet Identity (for local: use the II canister URL shown by dfx).

### 3. Get cycles (local vs mainnet)

- **Local:** The replica gives free cycles; you can `dfx wallet balance` and send to the launchpad wallet canister.
- **Mainnet:** Convert ICP to cycles: `dfx cycles convert --amount <ICP> --network ic`. Then send cycles to your Launchpad Wallet canister (e.g. from your dfx wallet using `wallet_send` to the launchpad_wallet’s `wallet_receive`).

### 4. Use from Cursor (MCP)

1. Build the MCP server:

```bash
cd mcp
npm install
npm run build
```

2. Add to Cursor MCP settings (e.g. `~/.cursor/mcp.json` or project MCP config):

```json
{
  "mcpServers": {
    "ic-launchpad": {
      "command": "node",
      "args": ["/absolute/path/to/ic-launchpad/mcp/dist/index.js"],
      "env": {
        "LAUNCHPAD_WALLET_CANISTER_ID": "<your launchpad_wallet canister id>",
        "LAUNCHPAD_REGISTRY_CANISTER_ID": "<your launchpad_registry canister id>",
        "DFX_NETWORK": "ic"
      }
    }
  }
}
```

3. In Cursor you can then say things like:
   - “What’s my launchpad cycles balance?” → `launchpad_balance`
   - “Create a new canister with 0.5T cycles” → `launchpad_create_canister`
   - “Top up canister X with 1T cycles” → `launchpad_top_up`
   - “List my canisters” → `launchpad_list_canisters`
   - “Deploy this project to IC” → `launchpad_deploy`

## Integrations (Google, GitHub, Discord)

Link external accounts in the **Integrations** page.

- **Google** — Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` (create a Web client at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)). Connect uses a popup (no backend).
- **GitHub & Discord** — Run the auth backend, create OAuth apps, and set env vars:

```bash
cd auth-backend
cp .env.example .env
# Edit .env: FRONTEND_URL=http://localhost:5173, then add GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
npm install
npm run dev
```

In **frontend/.env** set `VITE_AUTH_BACKEND_URL=http://localhost:3030`. When you click Connect for GitHub or Discord, the app redirects to the backend → provider → back to the app with the account linked.

**OAuth app setup:** See **[auth-backend/README.md](auth-backend/README.md)** for callback URLs and where to create each app.

## Canister overview

| Canister                 | Role                                                                 |
|--------------------------|----------------------------------------------------------------------|
| `launchpad_wallet`       | Holds cycles; `create_canister_with_cycles`, `top_up`; `wallet_receive` |
| `launchpad_registry`     | Registers canisters (id, name, network); `list_mine`, `register`     |
| `launchpad_integrations`| Linked accounts (Google, GitHub, etc.); `link`, `unlink`, `list_mine` |
| `launchpad_frontend`    | Static assets (React app)                                           |

## Convert ICP to cycles

- **CLI:** `dfx cycles convert --amount <ICP> --network ic`
- **Docs:** [Cycles conversion](https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert)

The Launchpad Wallet **holds** cycles; you add them by sending cycles to its `wallet_receive` (e.g. from your dfx wallet or another canister).

## Deploy from Cursor

1. Deploy the Launchpad once (locally or mainnet).
2. Configure the Launchpad MCP with the wallet and registry canister IDs.
3. In Cursor, describe what you want built and deployed; the assistant can call `launchpad_create_canister`, `launchpad_top_up`, `launchpad_register_canister`, and `launchpad_deploy` (which runs `dfx deploy` in your project).

## License

MIT
