import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "../lib/notificationsStore";

const LOCAL_AGENT_URL = "http://127.0.0.1:3847";

/** Browser blocks HTTPS→HTTP (mixed content). Mainnet app cannot reach localhost. */
function isMainnetOrigin() {
  const o = typeof window !== "undefined" ? window.location.origin : "";
  return o.includes("ic0.app") || o.includes("icp0.io");
}

export default function Secrets() {
  const { add: addNotification } = useNotifications();
  const [localAgentAvailable, setLocalAgentAvailable] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const checkAndLoad = useCallback(async () => {
    if (isMainnetOrigin()) {
      setLocalAgentAvailable(false);
      setLoading(false);
      return;
    }
    try {
      const r = await fetch(`${LOCAL_AGENT_URL}/health`);
      if (!r.ok) {
        setLocalAgentAvailable(false);
        setLoading(false);
        return;
      }
      setLocalAgentAvailable(true);
      const secretsR = await fetch(`${LOCAL_AGENT_URL}/secrets`);
      const data = await secretsR.json();
      if (data.ok) {
        setContent(data.content ?? "");
        setOriginalContent(data.content ?? "");
      }
    } catch {
      setLocalAgentAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAndLoad();
  }, [checkAndLoad]);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const save = async () => {
    if (!localAgentAvailable) return;
    setSaving(true);
    try {
      const r = await fetch(`${LOCAL_AGENT_URL}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await r.json();
      if (data.ok) {
        setOriginalContent(content);
        addNotification({ type: "success", title: "Saved", message: ".env.local updated" });
      } else {
        addNotification({ type: "error", title: "Save failed", message: data.error });
      }
    } catch (e) {
      addNotification({ type: "error", title: "Save failed", message: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setContent(originalContent);
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-8">Secrets</h1>
        <p className="text-gray-400">Connecting to local agent...</p>
      </div>
    );
  }

  if (!localAgentAvailable) {
    const onMainnet = isMainnetOrigin();
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-8">Secrets</h1>
        <div className="card border-amber-500/50 bg-amber-500/10 max-w-2xl mb-6">
          <p className="text-amber-400 font-medium mb-1">
            {onMainnet ? "Run Launchpad locally for Secrets" : "Local agent required"}
          </p>
          {onMainnet ? (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Browsers block HTTPS pages from accessing HTTP localhost (mixed-content security). The mainnet app cannot reach your machine. Run the Launchpad locally:
              </p>
              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">1. Local agent (REPOSITORIES root):</span>
                  <code className="block bg-ic-dark p-3 rounded-lg text-ic-green text-sm font-mono">node scripts/launchpad-local-agent.js</code>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">2. Launchpad dev server:</span>
                  <code className="block bg-ic-dark p-3 rounded-lg text-ic-green text-sm font-mono">cd ic-launchpad/frontend && npm run dev</code>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-0.5">3. Open in browser:</span>
                  <code className="block bg-ic-dark p-3 rounded-lg text-ic-green text-sm font-mono">http://localhost:5173/#/secrets</code>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Secrets are stored only on your machine. Run the local agent from the REPOSITORIES root:
              </p>
              <code className="block bg-ic-dark p-3 rounded-lg text-ic-green text-sm font-mono mb-4">node scripts/launchpad-local-agent.js</code>
            </>
          )}
          <p className="text-gray-500 text-sm">
            Your secrets stay in <code className="text-ic-green">.env.local</code> and sync to projects via <code className="text-ic-green">node scripts/env-sync.js</code>.
          </p>
        </div>
        <div className="card max-w-2xl border-ic-green/30">
          <h2 className="text-lg font-semibold text-white mb-2">Why not store secrets on-chain?</h2>
          <p className="text-gray-400 text-sm">
            The Internet Computer replicates canister state across subnet nodes. Storing API keys, mnemonics, or passwords there would expose them. Keeping secrets in .env.local and syncing to your agents via the local agent is the secure approach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Secrets</h1>
        <div className="flex gap-2">
          <button
            onClick={checkAndLoad}
            className="btn-secondary text-sm"
          >
            Reload
          </button>
          <button
            onClick={save}
            disabled={!hasChanges || saving}
            className="btn-primary text-sm"
          >
            {saving ? "Saving…" : "Save .env.local"}
          </button>
          {hasChanges && (
            <button onClick={discard} className="btn-secondary text-sm">
              Discard
            </button>
          )}
        </div>
      </div>

      <div className="card max-w-4xl mb-6">
        <p className="text-gray-400 text-sm mb-4">
          Edit your master secrets file. Changes are saved to <code className="text-ic-green">REPOSITORIES/.env.local</code>. Run <code className="text-ic-green">node scripts/env-sync.js</code> to sync to projects.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[400px] bg-ic-dark border border-ic-border rounded-lg p-4 font-mono text-sm text-gray-300 resize-y focus:outline-none focus:border-ic-green/50"
          placeholder="# Paste or edit .env.local content..."
          spellCheck={false}
        />
      </div>

      <div className="card max-w-2xl border-ic-green/20">
        <p className="text-ic-green text-sm font-medium mb-1">Secured locally</p>
        <p className="text-gray-500 text-xs">
          This page talks only to 127.0.0.1. Your secrets never leave your machine and are never stored on the Internet Computer.
        </p>
      </div>
    </div>
  );
}
