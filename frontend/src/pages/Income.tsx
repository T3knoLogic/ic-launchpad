import { useState, useEffect, useCallback } from "react";
import { useLaunchpad } from "../lib/useLaunchpad";
import { useNotifications } from "../lib/notificationsStore";
import { isLocalhost } from "../lib/auth";

const LOCAL_AGENT_URL = "http://127.0.0.1:3847";

type IncomeData = {
  gumroad: { success?: boolean; sales?: unknown[]; error?: string } | null;
  shopify: { orders?: unknown[]; error?: string } | null;
};

export default function Income() {
  const { agent, hasCanisterIds, balance } = useLaunchpad();
  const { add: addNotification } = useNotifications();
  const [data, setData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localAgentAvailable, setLocalAgentAvailable] = useState(false);
  const [dscvrContent, setDscvrContent] = useState("");
  const [dscvrPosting, setDscvrPosting] = useState(false);

  const fetchIncome = useCallback(async () => {
    if (!isLocalhost) {
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
      const ir = await fetch(`${LOCAL_AGENT_URL}/api/income`);
      const idata = await ir.json();
      if (idata.ok) setData({ gumroad: idata.gumroad ?? null, shopify: idata.shopify ?? null });
    } catch {
      setLocalAgentAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const postDscvr = async () => {
    if (!dscvrContent.trim() || !localAgentAvailable) {
      if (!localAgentAvailable) {
        navigator.clipboard.writeText(dscvrContent);
        window.open("https://h5aet-waaaa-aaaab-qaamq-cai.icp0.io", "_blank");
        addNotification({ type: "success", title: "Copied", message: "Open DSCVR and paste your post." });
      }
      return;
    }
    setDscvrPosting(true);
    try {
      const r = await fetch(`${LOCAL_AGENT_URL}/api/dscvr-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: dscvrContent.trim(), portal: "DSCVR" }),
      });
      const d = await r.json();
      if (d.ok) {
        setDscvrContent("");
        addNotification({ type: "success", title: "Queued", message: "Post saved for social-scheduler." });
      } else {
        addNotification({ type: "error", title: "Failed", message: d.error });
      }
    } catch (e) {
      addNotification({ type: "error", title: "Failed", message: String(e) });
    } finally {
      setDscvrPosting(false);
    }
  };

  const gumroadSales = data?.gumroad?.success && Array.isArray(data.gumroad.sales) ? data.gumroad.sales : [];
  const shopifyOrders = data?.shopify?.orders ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Income Dashboard</h1>
      {!isLocalhost && (
        <div className="card border-amber-500/50 bg-amber-500/10 mb-6 max-w-2xl">
          <p className="text-amber-400 font-medium mb-1">Run Launchpad locally</p>
          <p className="text-gray-400 text-sm">Income and DSCVR quick-post require the local agent. Run <code className="text-ic-green">node scripts/launchpad-local-agent.js</code> and open <code className="text-ic-green">http://localhost:5173/#/income</code></p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {hasCanisterIds && balance != null && (
          <div className="card">
            <h2 className="text-gray-400 text-sm font-medium mb-1">Wallet cycles</h2>
            <p className="text-2xl font-mono text-ic-green">{balance.toLocaleString()} cycles</p>
          </div>
        )}
        <div className="card">
          <h2 className="text-gray-400 text-sm font-medium mb-1">Gumroad</h2>
          {loading ? <p className="text-gray-500">Loading…</p> : localAgentAvailable ? (
            <>
              <p className="text-2xl font-mono text-white">{gumroadSales.length} recent sales</p>
              {data?.gumroad?.error && <p className="text-amber-400 text-xs mt-1">{data.gumroad.error}</p>}
              <button onClick={fetchIncome} className="btn-secondary text-sm mt-2">Refresh</button>
            </>
          ) : <p className="text-gray-500">—</p>}
        </div>
        <div className="card">
          <h2 className="text-gray-400 text-sm font-medium mb-1">Bazaar / Shopify</h2>
          {loading ? <p className="text-gray-500">Loading…</p> : localAgentAvailable ? (
            <>
              <p className="text-2xl font-mono text-white">{shopifyOrders.length} recent orders</p>
              {data?.shopify?.error && <p className="text-amber-400 text-xs mt-1">{data.shopify.error}</p>}
            </>
          ) : <p className="text-gray-500">—</p>}
        </div>
      </div>

      <div className="card max-w-2xl mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">DSCVR quick post</h2>
        <p className="text-gray-400 text-sm mb-4">Create a post for DSCVR. With local agent, it's queued for social-scheduler. Otherwise, copies to clipboard and opens DSCVR.</p>
        <textarea
          value={dscvrContent}
          onChange={(e) => setDscvrContent(e.target.value)}
          placeholder="Write your DSCVR post..."
          className="w-full h-32 bg-ic-dark border border-ic-border rounded-lg p-3 text-sm resize-y mb-3"
        />
        <button onClick={postDscvr} disabled={!dscvrContent.trim() || dscvrPosting} className="btn-primary">
          {dscvrPosting ? "Posting…" : localAgentAvailable ? "Queue post" : "Copy & open DSCVR"}
        </button>
      </div>

      {localAgentAvailable && (gumroadSales.length > 0 || shopifyOrders.length > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent activity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {gumroadSales.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm mb-2">Gumroad</h3>
                <ul className="space-y-2">
                  {gumroadSales.slice(0, 5).map((s: { id?: string; product_name?: string; amount?: number }, i: number) => (
                    <li key={s.id || i} className="text-sm text-gray-300">
                      {s.product_name} — ${((s.amount ?? 0) / 100).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {shopifyOrders.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm mb-2">Shopify</h3>
                <ul className="space-y-2">
                  {shopifyOrders.slice(0, 5).map((o: { id?: string; name?: string; total_price?: string }, i: number) => (
                    <li key={o.id || i} className="text-sm text-gray-300">
                      {o.name} — ${o.total_price ?? "—"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
