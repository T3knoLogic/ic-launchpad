import { Link } from "react-router-dom";
import { useLaunchpad } from "../lib/useLaunchpad";
import { useCanisterStatuses } from "../lib/useCanisterStatuses";
import { formatCycles } from "../lib/formatCycles";
import ActivityFeed from "../components/ActivityFeed";

export default function Dashboard() {
  const { agent, balance, canisters, error, hasCanisterIds, refreshBalance } = useLaunchpad();
  const { lowBalanceIds } = useCanisterStatuses(agent ?? null, canisters);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Dashboard</h1>
      {!hasCanisterIds && (
        <div className="card border-ic-green/50 bg-ic-green/5 mb-6">
          <p className="text-ic-green font-medium mb-1">Canisters not configured</p>
          <p className="text-gray-400 text-sm">
            To use the dashboard with local canisters, run <code className="text-ic-green">./scripts/run-local.sh</code> in WSL, then add the printed canister IDs to <code className="text-ic-green">frontend/.env</code> (VITE_LAUNCHPAD_WALLET_CANISTER_ID, VITE_LAUNCHPAD_REGISTRY_CANISTER_ID) and restart the dev server.
          </p>
        </div>
      )}
      {error && <div className="card border-red-500/50 text-red-400 mb-6">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="card">
          <h2 className="text-gray-400 text-sm font-medium mb-1">Wallet cycles</h2>
          <p className={`text-2xl font-mono ${balance != null && balance < 500_000_000_000n ? "text-amber-400" : "text-ic-green"}`}>
            {formatCycles(balance)}
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/wallet" className="btn-secondary text-sm">Manage wallet</Link>
            <button onClick={refreshBalance} className="btn-secondary text-sm">Refresh</button>
          </div>
        </div>
        <div className="card">
          <h2 className="text-gray-400 text-sm font-medium mb-1">Canisters</h2>
          <p className="text-2xl font-mono text-white">{canisters.length}</p>
          {lowBalanceIds.length > 0 && (
            <p className="text-amber-400 text-xs mt-1">{lowBalanceIds.length} low on cycles</p>
          )}
          <Link to="/canisters" className="inline-block mt-4 btn-secondary text-sm">View all</Link>
        </div>
        <div className="card">
          <h2 className="text-gray-400 text-sm font-medium mb-1">Network</h2>
          <p className="text-2xl font-mono text-white">
            {import.meta.env.VITE_NETWORK === "local" ? "Local" : "Mainnet"}
          </p>
          <span className="text-xs text-gray-500 block mt-1">IC0 / dfx</span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/deploy" className="btn-primary">Deploy</Link>
            <Link to="/income" className="btn-secondary">Income</Link>
            <Link to="/agents" className="btn-secondary">Agents</Link>
            <Link to="/secrets" className="btn-secondary">Secrets</Link>
            <Link to="/canisters" className="btn-secondary">Canisters</Link>
            <Link to="/explorer" className="btn-secondary">Explorer</Link>
            <a href="https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert" target="_blank" rel="noreferrer" className="btn-secondary">
              ICP → cycles
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-3">Create canisters or deploy ElizaOS agents via Docker.</p>
        </div>
        <ActivityFeed maxItems={8} />
      </div>
    </div>
  );
}
