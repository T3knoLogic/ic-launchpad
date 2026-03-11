import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useLaunchpad } from "../lib/useLaunchpad";
import { getIntegrationsActor, hasIntegrationsCanisterId } from "../lib/canisters";

const AUTH_BACKEND_URL = import.meta.env.VITE_AUTH_BACKEND_URL || "http://localhost:3030";
const BACKEND_PROVIDERS = ["github", "discord"];

type LinkedAccount = { provider: string; external_id: string; username: string };

const PROVIDERS: { id: string; name: string; icon: string; oauthDoc?: string }[] = [
  { id: "google", name: "Google", icon: "🔵", oauthDoc: "https://developers.google.com/identity/gsi/web" },
  { id: "x", name: "X (Twitter)", icon: "𝕏", oauthDoc: "https://developer.twitter.com/en/docs/authentication/oauth-2-0" },
  { id: "instagram", name: "Instagram", icon: "📷", oauthDoc: "https://developers.facebook.com/docs/instagram-basic-display-api" },
  { id: "tiktok", name: "TikTok", icon: "🎵", oauthDoc: "https://developers.tiktok.com/doc/oauth-user-access-token-management" },
  { id: "youtube", name: "YouTube", icon: "▶️", oauthDoc: "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps" },
  { id: "discord", name: "Discord", icon: "🎮", oauthDoc: "https://discord.com/developers/docs/topics/oauth2" },
  { id: "github", name: "GitHub", icon: "🐙", oauthDoc: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps" },
  { id: "twitch", name: "Twitch", icon: "💜", oauthDoc: "https://dev.twitch.tv/docs/authentication" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", oauthDoc: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow" },
];

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { agent } = useLaunchpad();
  const [linked, setLinked] = useState<LinkedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const loadLinked = useCallback(async () => {
    if (!agent || !hasIntegrationsCanisterId) return;
    try {
      const actor = getIntegrationsActor(agent);
      const list = await actor.list_mine();
      setLinked(list.map((a) => ({ provider: a.provider, external_id: a.external_id, username: a.username })));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [agent]);

  // Handle OAuth callback from auth-backend: ?linked=provider&external_id=...&username=... or ?error=...
  useEffect(() => {
    const linkedParam = searchParams.get("linked");
    const errorParam = searchParams.get("error");
    const externalId = searchParams.get("external_id");
    const username = searchParams.get("username");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setSearchParams({}, { replace: true });
      return;
    }
    if (!linkedParam || !externalId || !agent || !hasIntegrationsCanisterId) return;
    setSearchParams({}, { replace: true });
    (async () => {
      setConnecting(linkedParam);
      setError(null);
      try {
        const actor = getIntegrationsActor(agent);
        const result = await actor.link(linkedParam, externalId, username || externalId);
        if ("ok" in result) await loadLinked();
        else setError(result.err);
      } catch (e) {
        setError(String(e));
      } finally {
        setConnecting(null);
      }
    })();
  }, [searchParams, agent, loadLinked]);

  useEffect(() => {
    loadLinked();
  }, [loadLinked]);

  const linkAccount = async (provider: string, external_id: string, username: string) => {
    if (!agent || !hasIntegrationsCanisterId) return;
    setConnecting(provider);
    setError(null);
    try {
      const actor = getIntegrationsActor(agent);
      const result = await actor.link(provider, external_id, username);
      if ("ok" in result) await loadLinked();
      else setError(result.err);
    } catch (e) {
      setError(String(e));
    } finally {
      setConnecting(null);
    }
  };

  const unlinkAccount = async (provider: string) => {
    if (!agent || !hasIntegrationsCanisterId) return;
    setError(null);
    try {
      const actor = getIntegrationsActor(agent);
      await actor.unlink(provider);
      await loadLinked();
    } catch (e) {
      setError(String(e));
    }
  };

  const connectGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.");
      return;
    }
    if (!window.google?.accounts?.id) {
      setError("Google Identity Services script not loaded. Add the GIS script to index.html.");
      return;
    }
    setConnecting("google");
    setError(null);
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (res) => {
        try {
          const payload = JSON.parse(atob(res.credential.split(".")[1]));
          const sub = payload.sub as string;
          const name = (payload.name as string) || payload.email || sub.slice(0, 8);
          await linkAccount("google", sub, name);
        } catch (e) {
          setError(String(e));
        } finally {
          setConnecting(null);
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  const linkedByProvider = Object.fromEntries(linked.map((a) => [a.provider, a]));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Connected accounts</h1>
      {!hasIntegrationsCanisterId && (
        <div className="card border-ic-green/50 bg-ic-green/5 mb-6">
          <p className="text-ic-green font-medium mb-1">Integrations canister not configured</p>
          <p className="text-gray-400 text-sm">
            Add <code className="text-ic-green">VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID</code> to frontend/.env (from project .env after <code className="text-ic-green">dfx deploy</code>) to link external accounts.
          </p>
        </div>
      )}
      {error && <div className="card border-red-500/50 text-red-400 mb-6">{error}</div>}
      <div className="card max-w-2xl">
        <p className="text-gray-400 text-sm mb-6">
          Link your accounts to this Launchpad identity. Use them later for deploy notifications, cross-posting, or API access from your canisters.
        </p>
        {loading && hasIntegrationsCanisterId ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <ul className="space-y-4">
            {PROVIDERS.map((p) => {
              const account = linkedByProvider[p.id];
              return (
                <li key={p.id} className="flex items-center justify-between py-3 border-b border-ic-border last:border-0">
                  <span className="text-xl mr-3">{p.icon}</span>
                  <span className="text-white font-medium flex-1">{p.name}</span>
                  {account ? (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm truncate max-w-[180px]" title={account.username}>{account.username}</span>
                      <button
                        type="button"
                        onClick={() => unlinkAccount(p.id)}
                        className="btn-secondary text-sm"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : p.id === "google" ? (
                    <button
                      type="button"
                      onClick={connectGoogle}
                      disabled={!agent || !!connecting}
                      className="btn-primary text-sm"
                    >
                      {connecting === "google" ? "Connecting…" : "Connect"}
                    </button>
                  ) : BACKEND_PROVIDERS.includes(p.id) ? (
                    <a
                      href={`${AUTH_BACKEND_URL}/auth/${p.id}`}
                      className="btn-primary text-sm inline-block text-center"
                    >
                      Connect
                    </a>
                  ) : (
                    <a
                      href={p.oauthDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 text-sm hover:text-ic-green"
                    >
                      OAuth setup
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="card max-w-2xl mt-8">
        <h2 className="text-lg font-semibold text-white mb-2">Adding more providers</h2>
        <p className="text-gray-400 text-sm">
          Each provider requires an OAuth app (client ID/secret) in their developer portal. Google can be used with only a client ID and the Google Identity Services script in <code className="text-ic-green">index.html</code>. For X, Instagram, TikTok, YouTube, etc., you’ll need a small backend or serverless function to exchange the auth code for tokens and then call the Launchpad integrations canister with the user id and name.
        </p>
      </div>
    </div>
  );
}
