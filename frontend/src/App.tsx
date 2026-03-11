import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
import { useAuth, isLocalhost, isLocalhostWithMainnet } from "./lib/auth";
import HUDLayout from "./components/HUDLayout";
import DocsLayout from "./components/DocsLayout";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Canisters from "./pages/Canisters";
import Deploy from "./pages/Deploy";
import Agents from "./pages/Agents";
import Secrets from "./pages/Secrets";
import Income from "./pages/Income";
import Integrations from "./pages/Integrations";
import Explorer from "./pages/Explorer";
import Milady from "./pages/Milady";
import DocIntroduction from "./pages/docs/Introduction";
import DocGettingStarted from "./pages/docs/GettingStarted";
import DocWallet from "./pages/docs/Wallet";
import DocRegistry from "./pages/docs/Registry";
import DocDeploy from "./pages/docs/Deploy";
import DocCursorMCP from "./pages/docs/CursorMCP";
import DocReference from "./pages/docs/Reference";
import DocIntegrations from "./pages/docs/IntegrationsDoc";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Secrets & Agents work on localhost without II (mainnet II rejects localhost). */
function ProtectedOrLocalhost({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (isLocalhost || isAuthenticated) return <>{children}</>;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <HashRouter future={routerFuture}>
      <Routes>
        <Route path="/" element={<HUDLayout />}>
          <Route index element={<Landing />} />
          <Route path="dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="wallet" element={<Protected><Wallet /></Protected>} />
          <Route path="canisters" element={<Protected><Canisters /></Protected>} />
          <Route path="deploy" element={<Protected><Deploy /></Protected>} />
          <Route path="agents" element={<ProtectedOrLocalhost><Agents /></ProtectedOrLocalhost>} />
          <Route path="secrets" element={<ProtectedOrLocalhost><Secrets /></ProtectedOrLocalhost>} />
          <Route path="income" element={<ProtectedOrLocalhost><Income /></ProtectedOrLocalhost>} />
          <Route path="integrations" element={<Protected><Integrations /></Protected>} />
          <Route path="explorer" element={<Protected><Explorer /></Protected>} />
          <Route path="milady" element={<Protected><Milady /></Protected>} />
        </Route>
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<DocIntroduction />} />
          <Route path="getting-started" element={<DocGettingStarted />} />
          <Route path="wallet" element={<DocWallet />} />
          <Route path="registry" element={<DocRegistry />} />
          <Route path="deploy" element={<DocDeploy />} />
          <Route path="cursor-mcp" element={<DocCursorMCP />} />
          <Route path="reference" element={<DocReference />} />
          <Route path="integrations" element={<DocIntegrations />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function Landing() {
  const { login, isAuthenticated, isLoading } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-5xl font-bold text-white mb-4">ICP Launchpad</h1>
      <p className="text-gray-400 max-w-lg mb-6">
        Deploy apps and agents to the Internet Computer. Manage canisters, hold cycles, and convert ICP — all from one place. Use Cursor to build; use Launchpad to ship.
      </p>
      {isLocalhostWithMainnet && (
        <div className="max-w-lg mb-6 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-left">
          <p className="text-amber-400 font-medium mb-2">Internet Identity does not support localhost</p>
          <p className="text-gray-400 text-sm mb-3">
            Mainnet II rejects connections from localhost. To log in with your NNS identity, use the deployed app:
          </p>
          <ol className="text-gray-400 text-sm list-decimal list-inside space-y-1 mb-3">
            <li>In WSL: <code className="text-ic-green block mt-1">cd ic-launchpad && npm run build && dfx deploy launchpad_frontend --network ic</code></li>
            <li>Run <code className="text-ic-green">dfx canister id launchpad_frontend --network ic</code> to get the ID</li>
            <li>Open <code className="text-ic-green">https://&lt;canister_id&gt;.ic0.app</code></li>
          </ol>
          <p className="text-gray-500 text-xs mb-3">
            Or use full local dev: <code className="text-ic-green">VITE_NETWORK=local</code> with <code>./scripts/run-local.sh</code> and local II.
          </p>
          <p className="text-ic-green text-sm font-medium">On localhost you can use without login:</p>
          <div className="flex gap-2 mt-2">
            <a href="#/income" className="btn-secondary text-sm">Income</a>
            <a href="#/secrets" className="btn-secondary text-sm">Secrets</a>
            <a href="#/agents" className="btn-secondary text-sm">Agents</a>
          </div>
        </div>
      )}
      {!isLoading && !isLocalhostWithMainnet && (
        <button onClick={login} className="btn-primary text-lg px-8 py-3">
          Login with Internet Identity
        </button>
      )}
      {!isLoading && isLocalhostWithMainnet && (
        <a
          href="https://internetcomputer.org/docs/current/developer-docs/setup/install"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-lg px-8 py-3 inline-block"
        >
          View deployment docs
        </a>
      )}
    </div>
  );
}
