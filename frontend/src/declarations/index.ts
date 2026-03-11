export { idlFactory as launchpad_wallet_idl } from "../../../src/declarations/launchpad_wallet/launchpad_wallet.did.js";
export { idlFactory as launchpad_registry_idl } from "../../../src/declarations/launchpad_registry/launchpad_registry.did.js";
export { idlFactory as launchpad_integrations_idl } from "../../../src/declarations/launchpad_integrations/launchpad_integrations.did.js";

const walletId = (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_LAUNCHPAD_WALLET_CANISTER_ID ?? "";
const registryId = import.meta.env?.VITE_LAUNCHPAD_REGISTRY_CANISTER_ID ?? "";
const integrationsId = import.meta.env?.VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID ?? "";
const miladyId = import.meta.env?.VITE_MILADY_CANISTER_ID ?? "";

export const canisterIds = {
  launchpad_wallet: walletId || "",
  launchpad_registry: registryId || "",
  launchpad_integrations: integrationsId || "",
  milady_launchpad: miladyId || "",
};
