# ic-launchpad Deployment Status — 2026-03-10

## ✅ ICP Deposit Confirmed
- **Received:** 4.00051803 ICP  
- **Address:** `2faa9e8948315ecb08e3cafe744d85fd7b73a2da825399941008bd01c5b4b37e`

## ✅ Converted to Cycles
- 4 ICP → 7.186 T cycles (total 9.199 TC)
- Remaining ICP: 0.00041803 (below minimum convert amount)

## ✅ Deployed Canisters
| Canister | Status | ID |
|----------|--------|-----|
| launchpad_frontend | ✅ Live | `tnyst-jqaaa-aaaau-afpfq-cai` |
| launchpad_integrations | ✅ Live | `ty7d6-iyaaa-aaaau-afpga-cai` |
| launchpad_registry | ❌ Not created | — |
| launchpad_wallet | ❌ Not created | — |

## Frontend URL
**https://tnyst-jqaaa-aaaau-afpfq-cai.ic0.app**

⚠️ The frontend loads but Wallet and full features require launchpad_wallet and launchpad_registry. Those canisters were not created due to insufficient cycles.

## ⏳ To Complete Deployment
**Send ~1–2 more ICP** to the same address, then run:
```bash
wsl
cd /mnt/r/REPOSITORIES/ic-launchpad
export DFX_WARNING=-mainnet_plaintext_identity
dfx cycles convert --amount 1.5 --network=ic
dfx deploy launchpad_registry --network ic
dfx deploy launchpad_wallet --network ic
node scripts/sync-env.mjs
```

Then update `frontend/.env` with the new wallet and registry canister IDs, rebuild, and redeploy the frontend (it has hardcoded dependencies).

## Log Files
- `deploy_20260310_134113.log` — main deployment
- `dfx_deploy_20260310_134113.log` — dfx output
- `build_20260310_134113.log` — Vite build
- `npm_install_20260310_134113.log` — npm install
- `resume_20260310_134226.log` — resume attempt
