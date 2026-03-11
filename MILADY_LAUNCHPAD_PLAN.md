# Milady × ICP Launchpad Integration Plan

## Goal
Deploy a Milady instance to the ICP Launchpad with 3D avatar, full customization, and integration with our canisters + IC mainnet. Integrate ElizaOS, ai16z, and blockchain capabilities where applicable.

## Implemented ✅
- **Gemini**: Uses GEMINI_API_KEY from .env.local for language models and creative aspects
- **plugin-icp**: Loaded as core plugin; QUERY_ICP_LAUNCHPAD, QUERY_T3KNO_PRODUCTS, DRAFT_T3KNO_SOCIAL
- **T3kNo-Logic**: Product knowledge (NFT Matrix, Machina, Bonsai Widget, Bazaar); MILADY_T3KNO_KNOWLEDGE=true injects into character
- **Launchpad page**: `/milady` — embedded iframe, gateway help, full avatar/character customization
- **Deploy**: `deploy-milady.sh` passes .env.local (Gemini keys); Docker runs API + Gateway

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ICP Hosted (Asset Canister)                                     │
│  Milady Launchpad UI                                             │
│  - 3D VRM avatar (Three.js, @pixiv/three-vrm)                   │
│  - Chat UI + customization (themes, emotes, vibes)                 │
│  - @dfinity/agent → direct canister calls (wallet, registry)      │
│  - WebSocket client → configurable Gateway URL                    │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         │ HTTP/query calls                   │ WebSocket (when connected)
         ▼                                    ▼
┌──────────────────────┐           ┌─────────────────────────────┐
│  Launchpad Canisters  │           │  Milady Gateway              │
│  - tw5ow (wallet)     │           │  User runs locally:          │
│  - t76fk (registry)   │           │    milady start              │
│  - ty7d6 (integrations)│          │  Or cloud: Docker + wss://    │
└──────────────────────┘           │  ElizaOS brain + plugins      │
                                   │  - plugin-icp (ICP wallet)   │
                                   │  - plugin-solana, evm, etc.  │
                                   └─────────────────────────────┘
```

## Phases

### Phase 1: Update & plugin-icp ✅
- Update Milady to latest `2.0.0-alpha.80` (or latest stable when available)
- Add `@elizaos-plugins/plugin-icp` to Milady
- Configure plugin-icp for Launchpad wallet/principal

### Phase 2: ICP-deployable build
- Build Milady app with `VITE_GATEWAY_URL` or `VITE_API_BASE` for configurable backend
- When deployed on ICP: default to user-provided gateway URL (Settings) or "Launchpad only" mode
- "Launchpad only" mode: show wallet balance, canisters, top-up UI — no AI chat until gateway connected

### Phase 3: Deploy to Launchpad
- Create new asset canister `milady_launchpad` or use existing
- Deploy built Milady app assets
- Register canister in Launchpad
- Add to Agents page as deployable project (Docker: run Milady gateway for cloud mode)

### Phase 4: Integrations
- **ElizaOS**: Milady is already ElizaOS-based; gateway = Eliza runtime
- **ai16z**: ai16z-bonsai-agent, ai16z-shopify-agent patterns; add as plugins or connectors
- **Blockchains**: plugin-icp (ICP), plugin-solana, ethers (EVM) — already in Milady
- **Launchpad**: Direct canister calls from frontend for wallet/registry when no gateway

## Version Note
Milady is at `2.0.0-alpha.27` locally. Latest on GitHub: `2.0.0-alpha.80` (Mar 2026). No stable 2.0 yet — alpha is the most up-to-date.

## Build & Deploy

```bash
# From ic-launchpad (WSL recommended)
cd /mnt/r/REPOSITORIES/ic-launchpad
bash scripts/build-milady-for-icp.sh   # Builds Milady → milady-assets/dist
dfx deploy milady_launchpad --network ic
bash scripts/register-existing-canisters.sh  # Add new canister ID to register script first
```

## Run Milady Gateway (for full AI)
```bash
bash scripts/deploy-milady.sh   # Docker
# Or locally: cd milady && milady start
# Then open ICP-hosted Milady and connect to ws://your-host:18789/ws
```

## Key Files
- `milady/apps/app` — React + Vite UI
- `milady/apps/app/plugins/gateway` — WebSocket to Gateway
- `milady/apps/app/src/components/avatar/` — 3D VRM
- `plugin-icp` — ElizaOS ICP plugin
- `ic-launchpad/scripts/register-existing-canisters.sh` — register new canister
