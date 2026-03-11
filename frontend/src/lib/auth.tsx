import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@dfinity/agent";

// VITE_NETWORK=mainnet → mainnet II. VITE_NETWORK=local → local II (needs local replica).
// Mainnet II (identity.ic0.app) does NOT allow localhost – only deployed apps on ic0.app.
const network = import.meta.env.VITE_NETWORK || "mainnet";
export const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const useMainnetII = network === "mainnet";
const LOCAL_II_ID = import.meta.env.VITE_II_CANISTER_ID || "rdmx6-jaaaa-aaaaa-aaadq-cai";
const II_URL = useMainnetII ? "https://identity.ic0.app" : `http://localhost:4943/?canisterId=${LOCAL_II_ID}`;

export const isLocalhostWithMainnet = isLocalhost && useMainnetII;

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  principal: string | null;
  getIdentity: () => Promise<Identity | undefined>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AuthClient.create().then((client) => {
      setAuthClient(client);
      client.isAuthenticated().then((ok) => {
        setIsAuthenticated(ok);
        if (ok) {
          const identity = client.getIdentity();
          const p = identity.getPrincipal();
          if (p != null && typeof (p as Promise<unknown>).then === "function") {
            (p as Promise<{ toText: () => string }>).then((principal) => setPrincipal(principal?.toText() ?? null));
          } else {
            setPrincipal((p as { toText: () => string })?.toText?.() ?? null);
          }
        }
        setIsLoading(false);
      });
    });
  }, []);

  const getIdentity = async () => (authClient?.isAuthenticated() ? authClient.getIdentity() : undefined);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: II_URL,
      // Required for mainnet II + localhost: II must know our origin for the delegation callback.
      derivationOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
      onSuccess: () => {
        setIsAuthenticated(true);
        const p = authClient.getIdentity().getPrincipal();
        if (p != null && typeof (p as Promise<unknown>).then === "function") {
          (p as Promise<{ toText: () => string }>).then((principal) => setPrincipal(principal?.toText() ?? null));
        } else {
          setPrincipal((p as { toText: () => string })?.toText?.() ?? null);
        }
      },
      onError: (err) => {
        console.error("II login error:", err);
        // Surface the "Unable to connect" / derivation origin error for localhost users
        if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
          console.warn(
            "Internet Identity does not support localhost. To use mainnet canisters, deploy the app and open the IC URL (e.g. https://YOUR_CANISTER.ic0.app). For local dev, use VITE_NETWORK=local with dfx + local II."
          );
        }
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout({ returnTo: "/" });
    setIsAuthenticated(false);
    setPrincipal(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, principal, getIdentity, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
