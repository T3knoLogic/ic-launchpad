# Bonsai Valuation Growth Roadmap — ICP Landing Page

Static landing page for the Bonsai Valuation Growth Roadmap, hosted on the Internet Computer.

## Contents

- **index.html** — Full roadmap from `BONSAI_VALUATION_GROWTH_ROADMAP.html`
- **assets/** — Images: ecosystem infrastructure, tools inventory, valuation path, priority matrix
- **Logo** — Loaded from Shopify CDN (external)

## Build & Deploy

```bash
# From ic-launchpad (WSL recommended)
cd ic-launchpad
npm run valuation:build    # Copies HTML + images from REPOSITORIES
npm run valuation:deploy   # Build + deploy to mainnet
```

Or manually:

```bash
bash scripts/build-valuation-roadmap.sh
dfx deploy valuation_roadmap --network ic
```

## Register in Launchpad

After first deploy, add the canister to the registry:

```bash
VALUATION_ID=$(dfx canister id valuation_roadmap --network ic)
dfx canister call t76fk-faaaa-aaaau-afpgq-cai register "(principal \"$VALUATION_ID\", \"Valuation Roadmap\", \"ic\")" --network ic
```

Or add to `scripts/register-existing-canisters.sh`:

```bash
register_one "<CANISTER_ID>" "Valuation Roadmap"
```

## URL

After deploy: `https://<canister_id>.ic0.app` or `https://<canister_id>.icp0.io`
