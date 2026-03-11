# Testing the dashboard locally

You can run the full Launchpad (replica + canisters + dashboard) on your machine and test without mainnet.

## 1. Prerequisites

- **WSL2 (Ubuntu)** or a Linux/macOS terminal where you use `dfx`
- [IC SDK (dfx) installed](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- Node.js and npm in the repo (for the frontend)

## 2. One-time: run the local setup script

From the **ic-launchpad** project root, in a **WSL/bash** shell:

```bash
chmod +x scripts/run-local.sh
./scripts/run-local.sh
```

This will:

- Start a local replica (`dfx start --background --clean`)
- Deploy the Launchpad canisters to the **local** network
- Write **frontend/.env** with the local canister IDs (`VITE_LAUNCHPAD_WALLET_CANISTER_ID`, `VITE_LAUNCHPAD_REGISTRY_CANISTER_ID`)

## 3. Start the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## 4. Log in (Internet Identity)

The app uses Internet Identity (II) to log in.

### Option A: Use a **local** Internet Identity canister

1. Deploy II on your local replica (e.g. from the [internet-identity repo](https://github.com/dfinity/internet-identity)).
2. After deployment, note the II canister ID.
3. In **frontend/.env** add:
   ```bash
   VITE_II_CANISTER_ID=<your-local-ii-canister-id>
   ```
4. Restart the dev server (`npm run dev`) and use “Login with Internet Identity”. The auth flow will use your local II.

### Option B: Use **mainnet** Internet Identity from the local app

You can log in with **mainnet** II so you don’t need to deploy II locally. In **frontend/.env** add:

```bash
VITE_USE_MAINNET_II=true
```

Restart the dev server. The dashboard will still talk to your **local** canisters (wallet, registry), but login will use `https://identity.ic0.app`. Good for testing the UI and canister calls with a real identity.

## 5. What you can test locally

- **Dashboard** — View wallet balance (after sending cycles to the wallet canister), canister list, deploy page.
- **Wallet** — Cycles balance; link to cycles conversion docs.
- **Canisters** — List registered canisters; top-up form (canister ID + amount).
- **Deploy** — Create empty canister (uses cycles from the Launchpad Wallet); optional name and register.

On local, the replica gives you free cycles. You can fund the Launchpad Wallet by calling `wallet_receive` or `deposit()` (with attached cycles) from your dfx identity or another canister.

## 6. Stopping the replica

When you’re done:

```bash
dfx stop
```

Next time you want to test locally, run `./scripts/run-local.sh` again (it will start the replica and redeploy).

## 7. Configure Cursor MCP for local canisters

The ICP Launchpad MCP is configured in Cursor (`~/.cursor/mcp.json`) to use `DFX_NETWORK=local`.

**After deploying**, run the sync to push canister IDs to Cursor's MCP config:

```bash
npm run mcp:sync
```

Or use the full deploy + sync:

```bash
./scripts/deploy-and-configure-local.sh
```

The MCP also loads canister IDs from the project `.env` (written by dfx). If you prefer manual config, copy `canister-ids.local.json.example` to `canister-ids.local.json`, fill in the IDs, then run `npm run mcp:sync`.
