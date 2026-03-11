#!/bin/bash
# Register all existing T3kNo-Logic canisters in the ICP Launchpad registry.
# Run: wsl -e bash -lc "cd /mnt/r/REPOSITORIES/ic-launchpad && bash scripts/register-existing-canisters.sh"
export DFX_WARNING=-mainnet_plaintext_identity

REGISTRY="t76fk-faaaa-aaaau-afpgq-cai"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

register_one() {
  local cid="$1"
  local name="$2"
  echo "Registering: $name ($cid)"
  echo "(principal \"$cid\", \"$name\", \"ic\")" > /tmp/reg_arg.txt
  dfx canister call "$REGISTRY" register --argument-file /tmp/reg_arg.txt --network ic 2>&1
}

register_one "tw5ow-tiaaa-aaaau-afpha-cai" "Launchpad Wallet"
register_one "t76fk-faaaa-aaaau-afpgq-cai" "Launchpad Registry"
register_one "ty7d6-iyaaa-aaaau-afpga-cai" "Launchpad Integrations"
register_one "tnyst-jqaaa-aaaau-afpfq-cai" "Launchpad Frontend"
register_one "4muhp-2qaaa-aaaak-akuaq-cai" "Bazaar Frontend"
register_one "5vkq3-oqaaa-aaaae-abl7q-cai" "Bazaar Backend"
register_one "komze-xyaaa-aaaan-qz44q-cai" "Bazaar Payment System"
register_one "a2a7s-hiaaa-aaaab-abqaa-cai" "Bazaar Payment Backend"
register_one "sa6dz-5aaaa-aaaaa-qbquq-cai" "Bazaar Shopify Integration"
register_one "hbm2q-2aaaa-aaaas-qbh6q-cai" "Bazaar Payment Bridge"
# Milady Launchpad (add after first deploy: bash scripts/build-milady-for-icp.sh && dfx deploy milady_launchpad --network ic)
# register_one "<MILADY_CANISTER_ID>" "Milady AI"

echo "Done."
