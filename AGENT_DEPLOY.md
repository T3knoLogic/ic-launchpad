# Launchpad Local Agent & Secrets

## Secrets (optional)

Run the local agent to manage `.env.local` from the Launchpad:

1. `node scripts/launchpad-local-agent.js` from REPOSITORIES root
2. Open Launchpad → **Secrets**
3. Edit and save. Secrets stay on your machine — never on-chain.

---

# Deploy ElizaOS Agents via Launchpad

The Launchpad supports deploying ElizaOS agents via Docker. Agents run off-IC and connect to ICP canisters (Odin, DSCVR, etc.).

## Quick Start

### Option 1: One-click Deploy (recommended)

1. Start the local deploy agent from the REPOSITORIES root:
   ```bash
   node scripts/launchpad-local-agent.js
   ```
2. Run the Launchpad frontend locally (`npm run dev` in `ic-launchpad/frontend`).
3. Open **Deploy** → **Agents** tab, or go to **Agents**.
4. Click **Deploy** on an agent project.

### Option 2: Manual (WSL)

From the REPOSITORIES root in WSL:

```bash
bash scripts/deploy-eliza-agent.sh eliza-odin-trader
```

To stop:

```bash
bash scripts/stop-eliza-agent.sh eliza-odin-trader
```

## Prerequisites

- **Docker** running (Docker Desktop or Linux)
- **Node.js** (for env sync and local agent)
- **WSL** (Windows) for manual deploy

## Environment

Secrets are synced from `REPOSITORIES/.env.local` via `node scripts/env-sync.js`. The deploy script runs env-sync before building.

## Supported Agents

| Project            | Container    | Port |
|--------------------|-------------|------|
| eliza-odin-trader  | eliza-odin-trader | 3000, 3999 |

## Adding New Agents

1. Add a case in `scripts/deploy-eliza-agent.sh`.
2. Add an entry to `AGENT_PROJECTS` in `frontend/src/lib/agentProjects.ts`.
3. Add env keys in `scripts/env-sync.js` if needed.
