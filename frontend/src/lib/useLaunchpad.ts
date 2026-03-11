import { useState, useEffect, useCallback } from "react";
import { HttpAgent } from "@dfinity/agent";
import { getWalletActor, getRegistryActor, hasCanisterIds } from "./canisters";
import { useAuth } from "./auth";

// VITE_NETWORK=mainnet → ic0.app (deploy to IC). VITE_NETWORK=local → local replica. VITE_AGENT_HOST overrides.
const agentHost = import.meta.env.VITE_AGENT_HOST;
const network = import.meta.env.VITE_NETWORK || "mainnet";
const host = agentHost ?? (network === "mainnet" ? "https://ic0.app" : "http://127.0.0.1:4943");

const isInvalidDelegationError = (e: unknown) => {
  const s = String(e);
  return s.includes("Invalid delegation") || s.includes("IcCanisterSignature");
};

export function useLaunchpad() {
  const { getIdentity, logout } = useAuth();
  const [agent, setAgent] = useState<HttpAgent | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [walletPrincipal, setWalletPrincipal] = useState<string | null>(null);
  const [canisters, setCanisters] = useState<Array<{ id: string; name: string; network: string; created_at: bigint }>>([]);
  const [error, setError] = useState<string | null>(null);

  const initAgent = useCallback(async () => {
    const identity = await getIdentity();
    if (!identity) return null;
    const ag = new HttpAgent({ identity, host });
    if (host.startsWith("http://127.0.0.1") || host.startsWith("http://localhost")) await ag.fetchRootKey();
    return ag;
  }, [getIdentity]);

  useEffect(() => {
    initAgent().then((a) => {
      setAgent(a);
      if (!a || !hasCanisterIds) return;
      try {
        const wallet = getWalletActor(a);
        const registry = getRegistryActor(a);
        wallet.get_balance().then((b) => setBalance(b)).catch((e) => setError(String(e)));
        wallet.whoami().then((p) => setWalletPrincipal(p.toText())).catch(() => setWalletPrincipal(null));
        registry.list_all().then((list) => setCanisters(list.map((c) => ({ id: c.id.toText(), name: c.name, network: c.network, created_at: BigInt(c.created_at) })))).catch((e) => setError(String(e)));
      } catch (_) {
        setError("Set VITE_LAUNCHPAD_WALLET_CANISTER_ID and VITE_LAUNCHPAD_REGISTRY_CANISTER_ID in frontend/.env");
      }
    });
  }, [initAgent]);

  const refreshBalance = useCallback(() => {
    if (!agent || !hasCanisterIds) return;
    try {
      const handleErr = (e: unknown) => {
        if (isInvalidDelegationError(e)) {
          logout();
          setError("Stale mainnet session cleared. Please log in again with local Internet Identity.");
        } else {
          setError(String(e));
        }
      };
      getWalletActor(agent).get_balance().then(setBalance).catch(handleErr);
    } catch (_) {}
  }, [agent, logout]);

  const refreshCanisters = useCallback(() => {
    if (!agent || !hasCanisterIds) return;
    try {
      const handleErr = (e: unknown) => {
        if (isInvalidDelegationError(e)) {
          logout();
          setError("Stale mainnet session cleared. Please log in again with local Internet Identity.");
        } else {
          setError(String(e));
        }
      };
      getRegistryActor(agent).list_all().then((list) => setCanisters(list.map((c) => ({ id: c.id.toText(), name: c.name, network: c.network, created_at: BigInt(c.created_at) })))).catch(handleErr);
    } catch (_) {}
  }, [agent, logout]);

  return { agent, balance, walletPrincipal, canisters, error, hasCanisterIds, refreshBalance, refreshCanisters };
}
