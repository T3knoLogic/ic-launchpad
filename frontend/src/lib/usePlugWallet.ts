/**
 * Plug Wallet integration for cycle management.
 * Uses requestBurnXTC to send cycles from user's XTC to a canister.
 * Docs: https://docs.plugwallet.ooo/developer-guides/connect-to-plug/
 *       https://docs.plugwallet.ooo/developer-guides/balances-transactions/
 */
import { useState, useCallback, useEffect } from "react";

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (opts?: { whitelist?: string[]; host?: string; timeout?: number }) => Promise<{ publicKey: string }>;
        isConnected: () => Promise<boolean>;
        disconnect: () => void;
        principalId?: string;
        requestBurnXTC: (params: { amount: number; to: string }) => Promise<unknown>;
      };
    };
  }
}

const PLUG_HOST = "https://mainnet.dfinity.network";

export function usePlugWallet(whitelist: string[]) {
  const [connected, setConnected] = useState(false);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPlug = typeof window !== "undefined" && window.ic?.plug != null;

  const connect = useCallback(async () => {
    if (!hasPlug) {
      setError("Plug extension not detected. Install from plugwallet.ooo");
      window.open("https://plugwallet.ooo", "_blank");
      return;
    }
    setError(null);
    try {
      await window.ic!.plug!.requestConnect({ whitelist, host: PLUG_HOST });
      const ok = await window.ic!.plug!.isConnected();
      setConnected(ok);
      setPrincipalId(ok ? (window.ic!.plug!.principalId ?? null) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setConnected(false);
      setPrincipalId(null);
    }
  }, [hasPlug, whitelist]);

  const disconnect = useCallback(() => {
    if (hasPlug) window.ic!.plug!.disconnect();
    setConnected(false);
    setPrincipalId(null);
    setError(null);
  }, [hasPlug]);

  const depositCycles = useCallback(
    async (toCanisterId: string, amountCycles: bigint) => {
      if (!hasPlug || !connected) {
        setError("Connect Plug first");
        return { ok: false as const, error: "Connect Plug first" };
      }
      setError(null);
      try {
        await window.ic!.plug!.requestBurnXTC({
          amount: Number(amountCycles),
          to: toCanisterId,
        });
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return { ok: false as const, error: msg };
      }
    },
    [hasPlug, connected]
  );

  useEffect(() => {
    if (!hasPlug) return;
    window.ic!.plug!.isConnected().then((ok) => {
      setConnected(ok);
      if (ok) setPrincipalId(window.ic!.plug!.principalId ?? null);
      else setPrincipalId(null);
    });
  }, [hasPlug]);

  useEffect(() => {
    if (!hasPlug) return;
    const cb = () => {
      setConnected(false);
      setPrincipalId(null);
    };
    try {
      (window.ic!.plug as { onExternalDisconnect?: (cb: () => void) => void }).onExternalDisconnect?.(cb);
    } catch (_) {}
    return () => {};
  }, [hasPlug]);

  return { hasPlug, connected, principalId, error, connect, disconnect, depositCycles };
}
