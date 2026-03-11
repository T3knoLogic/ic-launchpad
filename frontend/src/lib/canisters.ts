import { Actor, HttpAgent } from "@dfinity/agent";
import { launchpad_wallet_idl, launchpad_registry_idl, launchpad_integrations_idl, canisterIds } from "../declarations";

export const hasCanisterIds =
  !!canisterIds.launchpad_wallet?.trim() && !!canisterIds.launchpad_registry?.trim();

export const hasIntegrationsCanisterId = !!canisterIds.launchpad_integrations?.trim();

export function getWalletActor(agent: HttpAgent) {
  const id = canisterIds.launchpad_wallet?.trim();
  if (!id) throw new Error("Set VITE_LAUNCHPAD_WALLET_CANISTER_ID in frontend/.env (copy from project .env after dfx deploy).");
  return Actor.createActor(launchpad_wallet_idl, { agent, canisterId: id });
}

export function getRegistryActor(agent: HttpAgent) {
  const id = canisterIds.launchpad_registry?.trim();
  if (!id) throw new Error("Set VITE_LAUNCHPAD_REGISTRY_CANISTER_ID in frontend/.env.");
  return Actor.createActor(launchpad_registry_idl, { agent, canisterId: id });
}

export function getIntegrationsActor(agent: HttpAgent) {
  const id = canisterIds.launchpad_integrations?.trim();
  if (!id) throw new Error("Set VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID in frontend/.env.");
  return Actor.createActor(launchpad_integrations_idl, { agent, canisterId: id });
}
