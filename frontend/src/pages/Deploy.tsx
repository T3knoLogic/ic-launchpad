import { useState } from "react";
import { Link } from "react-router-dom";
import { useLaunchpad } from "../lib/useLaunchpad";
import { getWalletActor, getRegistryActor } from "../lib/canisters";
import { addActivity } from "../lib/activityStore";
import { useNotifications } from "../lib/notificationsStore";
import AgentDeployCards from "../components/AgentDeployCards";

const DEFAULT_CYCLES = "500_000_000_000"; // 0.5T, enough for create on many subnets

type Tab = "canisters" | "agents";

export default function Deploy() {
  const { agent, hasCanisterIds, refreshBalance, refreshCanisters } = useLaunchpad();
  const { add: addNotification } = useNotifications();
  const [tab, setTab] = useState<Tab>("canisters");
  const [cycles, setCycles] = useState(DEFAULT_CYCLES);
  const [canisterName, setCanisterName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [network, setNetwork] = useState<"local" | "ic">("ic");

  const createCanister = async () => {
    if (!agent || !hasCanisterIds) return;
    const amount = BigInt(cycles.replace(/_/g, ""));
    setStatus("Creating canister...");
    setCreatedId(null);
    try {
      const wallet = getWalletActor(agent);
      const result = await wallet.create_canister_with_cycles(amount, null);
      if ("ok" in result) {
        const id = result.ok.toText();
        setCreatedId(id);
        setStatus("Created: " + id);
        refreshBalance();
        addActivity({ type: "create", title: "Created canister", detail: canisterName.trim() || id });
        addNotification({ type: "success", title: "Canister created", message: id });
        if (canisterName.trim()) {
          const registry = getRegistryActor(agent);
          await registry.register(result.ok, canisterName.trim(), network);
          refreshCanisters();
        }
      } else {
        setStatus("Error: " + result.err);
        addNotification({ type: "error", title: "Create failed", message: result.err });
      }
    } catch (e) {
      setStatus("Error: " + String(e));
      addNotification({ type: "error", title: "Create failed", message: String(e) });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Deploy</h1>
        <div className="flex rounded-lg border border-ic-border p-0.5 bg-ic-dark/50">
          <button
            onClick={() => setTab("canisters")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === "canisters" ? "bg-ic-green text-ic-dark" : "text-gray-400 hover:text-white"
            }`}
          >
            Canisters
          </button>
          <button
            onClick={() => setTab("agents")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === "agents" ? "bg-ic-green text-ic-dark" : "text-gray-400 hover:text-white"
            }`}
          >
            Agents
          </button>
        </div>
      </div>

      {tab === "canisters" && (
        <>
          {!hasCanisterIds && (
            <div className="card border-ic-green/50 bg-ic-green/5 mb-6 max-w-2xl">
              <p className="text-ic-green font-medium mb-1">Canisters not configured</p>
              <p className="text-gray-400 text-sm">Add wallet and registry canister IDs to <code className="text-ic-green">frontend/.env</code> to create canisters. See Docs → Getting started.</p>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Create empty canister</h2>
              <p className="text-gray-400 text-sm mb-6">
                Creates a new canister with the given cycles. Install code via dfx or Cursor/MCP.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Cycles (e.g. 500_000_000_000)</label>
                  <input
                    type="text"
                    value={cycles}
                    onChange={(e) => setCycles(e.target.value)}
                    className="w-full bg-ic-dark border border-ic-border rounded-lg px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Name (optional, for registry)</label>
                  <input
                    type="text"
                    value={canisterName}
                    onChange={(e) => setCanisterName(e.target.value)}
                    placeholder="my-app"
                    className="w-full bg-ic-dark border border-ic-border rounded-lg px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as "local" | "ic")}
                    className="w-full bg-ic-dark border border-ic-border rounded-lg px-3 py-2"
                  >
                    <option value="ic">Mainnet (ic)</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <button onClick={createCanister} className="btn-primary" disabled={!agent || !hasCanisterIds}>
                  Create canister
                </button>
              </div>
              {status && <p className="mt-4 text-sm text-gray-400">{status}</p>}
              {createdId && (
                <div className="mt-4 p-3 rounded-lg bg-ic-dark border border-ic-border">
                  <p className="text-ic-green font-mono text-sm break-all">{createdId}</p>
                  <a href={`https://${createdId}.ic0.app`} target="_blank" rel="noreferrer" className="text-ic-green text-sm hover:underline">
                    Open on IC
                  </a>
                </div>
              )}
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-2">Deploy from Cursor</h2>
              <p className="text-gray-400 text-sm mb-4">
                Use the Launchpad MCP server in Cursor to create canisters, top up, and run <code className="text-ic-green">dfx deploy</code> from chat.
              </p>
              <p className="text-gray-500 text-sm mb-4">See <code className="text-ic-green">mcp/README.md</code> for setup.</p>
              <Link to="/canisters" className="btn-secondary text-sm inline-block">
                View canisters →
              </Link>
            </div>
          </div>
        </>
      )}

      {tab === "agents" && (
        <div>
          <p className="text-gray-400 mb-6 max-w-2xl">
            Deploy ElizaOS agents via Docker. Agents run off-IC and connect to ICP canisters (Odin, DSCVR, etc.).
          </p>
          <AgentDeployCards />
          <div className="mt-6">
            <Link to="/agents" className="text-ic-green hover:underline text-sm">Full Agents page →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
