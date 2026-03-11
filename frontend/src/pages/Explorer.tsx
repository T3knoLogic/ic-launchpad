import { useState, useCallback } from "react";
import { useLaunchpad } from "../lib/useLaunchpad";
import { useCanisterStatuses } from "../lib/useCanisterStatuses";
import { formatCycles } from "../lib/formatCycles";
import { CopyButton } from "../components/CopyButton";
import { addBookmark, removeBookmark, getBookmarks, isBookmarked } from "../lib/bookmarksStore";

export default function Explorer() {
  const { agent, canisters, hasCanisterIds } = useLaunchpad();
  const { statusMap, loading: statusLoading, refresh, lowBalanceIds } = useCanisterStatuses(
    agent ?? null,
    canisters
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());

  const selectedStatus = selectedId ? statusMap[selectedId] : null;

  const handleBookmark = useCallback((canisterId: string, name?: string) => {
    if (isBookmarked(canisterId)) {
      removeBookmark(canisterId);
    } else {
      addBookmark({ canisterId, name });
    }
    setBookmarks(getBookmarks());
  }, []);

  const url = (id: string, net: string) =>
    net === "ic" ? `https://dashboard.internetcomputer.org/canister/${id}` : `http://${id}.localhost:4943`;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Canister Explorer</h1>
      <p className="text-gray-400 text-sm mb-8">
        Inspect cycles, controllers, and call methods on your canisters.
      </p>

      {!hasCanisterIds && (
        <div className="card border-ic-green/50 bg-ic-green/5 mb-6">
          <p className="text-ic-green font-medium mb-1">Canisters not configured</p>
          <p className="text-gray-400 text-sm">Add wallet and registry canister IDs to use the explorer.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Your canisters</h2>
            <button onClick={refresh} className="btn-secondary text-sm" disabled={statusLoading}>
              {statusLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {canisters.map((c) => (
              <li
                key={c.id}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedId === c.id
                    ? "border-ic-green bg-ic-green/10"
                    : "border-ic-border hover:border-ic-green/50"
                }`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-ic-green">{c.name || c.id.slice(0, 12) + "…"}</span>
                    <code className="block text-gray-500 text-xs mt-0.5 truncate" title={c.id}>{c.id}</code>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleBookmark(c.id, c.name); }}
                    className="text-gray-500 hover:text-ic-green"
                    title={isBookmarked(c.id) ? "Unbookmark" : "Bookmark"}
                  >
                    {isBookmarked(c.id) ? "★" : "☆"}
                  </button>
                </div>
                {statusMap[c.id] && (
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className={lowBalanceIds.includes(c.id) ? "text-amber-400" : "text-gray-400"}>
                      {formatCycles(statusMap[c.id].cycles, { suffix: false })}
                    </span>
                    <span className="text-gray-500">{statusMap[c.id].controllers.length} controllers</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Canister details</h2>
          {!selectedId ? (
            <p className="text-gray-500">Select a canister</p>
          ) : selectedStatus ? (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Canister ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-ic-green font-mono text-sm break-all">{selectedId}</code>
                  <CopyButton text={selectedId} />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Cycles</label>
                <p className={`font-mono ${lowBalanceIds.includes(selectedId) ? "text-amber-400" : "text-white"}`}>
                  {formatCycles(selectedStatus.cycles)}
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Memory</label>
                <p className="font-mono text-white">
                  {(Number(selectedStatus.memory_size || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Controllers</label>
                <ul className="mt-1 space-y-1">
                  {selectedStatus.controllers.map((p) => (
                    <li key={p} className="flex items-center gap-2 font-mono text-sm">
                      <code className="text-gray-400 truncate max-w-[200px]" title={p}>{p}</code>
                      <CopyButton text={p} label="Copy" className="text-xs" />
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={url(selectedId, selectedStatus.network)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-sm inline-block"
              >
                Open in IC Dashboard
              </a>
            </div>
          ) : (
            <p className="text-gray-500">Loading status… (you must be a controller)</p>
          )}
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Bookmarks</h2>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((b) => (
              <button
                key={`${b.canisterId}-${b.method || ""}`}
                type="button"
                onClick={() => setSelectedId(b.canisterId)}
                className="px-3 py-1.5 rounded-lg border border-ic-border hover:border-ic-green/50 text-sm font-mono"
              >
                {b.name || b.canisterId.slice(0, 8)}…
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
