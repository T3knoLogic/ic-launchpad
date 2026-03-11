# Deploy ic-launchpad to Mainnet (IC Network)

## ICP Deposit Address

**Run this in WSL to get your deposit address:**

```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
./scripts/get-icp-deposit-address.sh
```

Copy the 64-character hex string. Send **ICP** to that address from your exchange (Binance, Coinbase, Kraken, etc.). Use network "Internet Computer" or "ICP".

---

## Exact Cost Calculation

### Reference rates
- **1 trillion (T) cycles = 1 XDR ≈ $1.35 USD**
- **Canister creation:** 500 billion cycles per canister ≈ $0.65 USD
- **ICP price:** ~$2.45 USD

### ic-launchpad canisters (4 total)
| Canister | Type | Create cost | Initial top-up | Notes |
|----------|------|-------------|----------------|-------|
| launchpad_wallet | Motoko | 500B cycles | 1 T | Holds cycles, creates/top-ups canisters |
| launchpad_registry | Motoko | 500B cycles | 0.5 T | Canister registry |
| launchpad_integrations | Motoko | 500B cycles | 0.5 T | Linked accounts (OAuth) |
| launchpad_frontend | Assets | 500B cycles | 1 T | Static files (~550 KB) |

### Total cycles required
| Item | Cycles | USD equivalent |
|------|--------|----------------|
| Canister creation (4 × 500B) | 2 T | $2.70 |
| Initial top-up (wallet + frontend + others) | 3 T | $4.05 |
| Buffer (messaging, install, rounding) | 1.5 T | $2.00 |
| **Total** | **~6.5 T cycles** | **~$8.80** |

### ICP required
At **$2.45/ICP**: $8.80 ÷ $2.45 = **~3.6 ICP**

### Recommendation
**Deposit 4 ICP** — covers deployment with ~10% buffer for conversion spread and future top-ups.

---

## Deployment steps (WSL)

### 1. Prerequisites
- WSL2 Ubuntu with [IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install) installed
- 4+ ICP in your dfx identity’s ledger account

### 2. Get deposit address and fund
```bash
cd /mnt/r/REPOSITORIES/ic-launchpad
./scripts/get-icp-deposit-address.sh
# Send 4 ICP to the displayed address
dfx ledger balance --network=ic   # Verify after deposit
```

### 3. Convert ICP to cycles
```bash
dfx cycles convert --amount 4 --network=ic
dfx cycles balance --network=ic   # Should show ~6+ TC
```

### 4. Build and deploy
```bash
cd frontend && npm run build && cd ..
./scripts/deploy-mainnet.sh
```

### 5. Sync env and verify
```bash
node scripts/sync-env.mjs
# Frontend URL: https://<canister-id>.ic0.app
```

---

## Launchpad wallet functionality

Once deployed, the **launchpad_wallet** canister supports:

- **wallet_receive()** / **deposit()** — receive cycles
- **get_balance()** — read balance
- **create_canister_with_cycles()** — create canisters (from Wallet UI)
- **top_up()** — top up canisters
- **whoami()** — canister principal

Use the Wallet page in the frontend to manage cycles, deploy canisters, and link OISY/Plug for token/asset management.
