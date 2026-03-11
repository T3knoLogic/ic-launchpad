import { useState } from "react";
import { useLaunchpad } from "../lib/useLaunchpad";
import { useCanisterStatuses } from "../lib/useCanisterStatuses";
import { getWalletActor } from "../lib/canisters";
import { loadCycleAlerts } from "../lib/cycleAlertsStore";
import { formatCycles } from "../lib/formatCycles";
import { addActivity } from "../lib/activityStore";
import { useNotifications } from "../lib/notificationsStore";
import { CopyButton } from "../components/CopyButton";

export default function Canisters() {
  const { agent, canisters, error, hasCanisterIds, refreshCanisters, refreshBalance } = useLaunchpad();
  const { statusMap, refresh: refreshStatuses, lowBalanceIds, lowCyclesThreshold } = useCanisterStatuses(agent ?? null, canisters);
  const { add: addNotification } = useNotifications();
  const [topUpId, setTopUpId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("1000000000000"); // 1T
  const [topUpStatus, setTopUpStatus] = useState<string | null>(null);
  const [selectedForControllers, setSelectedForControllers] = useState<string | null>(null);

  const doTopUp = async () => {
    if (!agent || !hasCanisterIds || !topUpId.trim()) return;
    setTopUpStatus("Sending...");
    try {
      const wallet = getWalletActor(agent);
      const amount = BigInt(topUpAmount.replace(/_/g, ""));
      const { Principal } = await import("@dfinity/principal");
      const principal = Principal.fromText(topUpId.trim());
      const result = await wallet.top_up(principal, amount);
      if ("ok" in result) {
        setTopUpStatus("Topped up.");
        refreshBalance();
        refreshStatuses();
        addActivity({ type: "topup", title: "Topped up canister", detail: `${topUpId.slice(0, 12)}… with ${formatCycles(amount, { suffix: false })}` });
        addNotification({ type: "success", title: "Top-up complete", message: `${formatCycles(amount)} sent to canister` });
      } else {
        setTopUpStatus("Error: " + result.err);
        addNotification({ type: "error", title: "Top-up failed", message: result.err });
      }
    } catch (e) {
      setTopUpStatus("Error: " + String(e));
      addNotification({ type: "error", title: "Top-up failed", message: String(e) });
    }
  };

  const url = (id: string, net: string) =>
    net === "ic" ? `https://${id}.ic0.app` : `http://${id}.localhost:4943`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Canisters</h1>
        <button onClick={() => { refreshCanisters(); refreshStatuses(); }} className="btn-secondary text-sm w-fit">
          Refresh all
        </button>
      </div>
      {!hasCanisterIds && (
        <div className="card border-ic-green/50 bg-ic-green/5 mb-6">
          <p className="text-ic-green font-medium mb-1">Canisters not configured</p>
          <p className="text-gray-400 text-sm">Add wallet and registry canister IDs to <code className="text-ic-green">frontend/.env</code> to use this page. See Docs → Getting started.</p>
        </div>
      )}
      {error && <div className="card border-red-500/50 text-red-400 mb-6">{error}</div>}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Top up cycles</h2>
        {lowBalanceIds.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/50">
            <p className="text-amber-400 text-sm mb-2">{lowBalanceIds.length} canister(s) below {formatCycles(lowCyclesThreshold, { suffix: false })}</p>
            <button
              onClick={async () => {
                const amount = BigInt((loadCycleAlerts().autoTopUpAmountT || 1) * 1e12);
                for (const id of lowBalanceIds) {
                  if (!agent || !hasCanisterIds) return;
                  try {
                    const wallet = getWalletActor(agent);
                    const { Principal } = await import("@dfinity/principal");
                    const r = await wallet.top_up(Principal.fromText(id), amount);
                    if ("ok" in r) {
                      addNotification({ type: "success", title: "Topped up", message: `${id.slice(0, 12)}…` });
                    } else addNotification({ type: "error", title: "Failed", message: r.err });
                  } catch (e) {
                    addNotification({ type: "error", title: "Failed", message: String(e) });
                  }
                  refreshBalance();
                  refreshStatuses();
                }
              }}
              className="btn-primary text-sm"
            >
              Top up all low ({lowBalanceIds.length})
            </button>
          </div>
        )}
        <p className="text-gray-400 text-sm mb-4">Send cycles from your Launchpad Wallet to a canister.</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Canister ID</label>
            <input
              type="text"
              value={topUpId}
              onChange={(e) => setTopUpId(e.target.value)}
              placeholder="e.g. rrkah-fqaaa-aaaaa-aaaaq-cai"
              className="bg-ic-dark border border-ic-border rounded-lg px-3 py-2 w-72 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Cycles (e.g. 1000000000000 = 1T)</label>
            <input
              type="text"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="bg-ic-dark border border-ic-border rounded-lg px-3 py-2 w-48 font-mono text-sm"
            />
          </div>
          <button onClick={doTopUp} className="btn-primary" disabled={!agent || !hasCanisterIds}>Top up</button>
        </div>
        {topUpStatus && <p className="mt-2 text-sm text-gray-400">{topUpStatus}</p>}
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Your canisters</h2>
        {canisters.length === 0 ? (
          <p className="text-gray-500">No canisters registered. Deploy one from the Deploy page, then register it here.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canisters.map((c) => {
              const status = statusMap[c.id];
              const isLow = lowBalanceIds.includes(c.id);
              const openUrl = url(c.id, c.network);
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition hover:border-ic-green/30 ${
                    isLow ? "border-amber-500/50 bg-amber-500/5" : "border-ic-border bg-ic-dark/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-ic-green font-medium truncate max-w-[140px]">{c.name || c.id.slice(0, 8) + "…"}</span>
                    {status && (
                      <span className={`text-xs font-mono ${isLow ? "text-amber-400" : "text-gray-500"}`}>
                        {formatCycles(status.cycles, { suffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <code className="text-gray-500 text-xs truncate flex-1 min-w-0" title={c.id}>{c.id}</code>
                    <CopyButton text={c.id} label="Copy" className="!p-1 !text-[10px] flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={openUrl} target="_blank" rel="noreferrer" className="text-xs btn-primary !py-1.5 !px-3">
                      Open
                    </a>
                    <button type="button" onClick={() => setTopUpId(c.id)} className="text-xs btn-secondary !py-1.5 !px-3">
                      Top up
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForControllers(selectedForControllers === c.id ? null : c.id)}
                      className="text-xs btn-secondary !py-1.5 !px-3"
                    >
                      Controllers
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {selectedForControllers && statusMap[selectedForControllers] && (
          <div className="mt-4 p-4 rounded-lg bg-ic-dark/80 border border-ic-border">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Controllers for {statusMap[selectedForControllers].name || selectedForControllers.slice(0, 12)}…</h3>
            <ul className="space-y-1 font-mono text-xs">
              {statusMap[selectedForControllers].controllers.map((p) => (
                <li key={p} className="text-ic-green truncate" title={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
