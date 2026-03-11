import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Layout() {
  const { isAuthenticated, principal, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ic-border bg-ic-panel/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="font-display font-bold text-xl text-white">
            ICP Launchpad
          </NavLink>
          <span
            className="text-xs px-2 py-0.5 rounded bg-ic-green/20 text-ic-green border border-ic-green/40"
            title={import.meta.env.VITE_NETWORK === "local" ? "Connected to local replica" : "Connected to IC mainnet"}
          >
            {import.meta.env.VITE_NETWORK === "local" ? "local" : "mainnet"}
          </span>
          <nav className="flex items-center gap-6">
            <NavLink to="/docs" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
              Docs
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
                  Dashboard
                </NavLink>
                <NavLink to="/wallet" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
                  Wallet
                </NavLink>
                <NavLink to="/canisters" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
                  Canisters
                </NavLink>
                <NavLink to="/deploy" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
                  Deploy
                </NavLink>
                <NavLink to="/integrations" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
                  Integrations
                </NavLink>
                <span className="text-gray-500 text-sm font-mono truncate max-w-[120px]" title={principal || ""}>
                  {principal ? `${principal.slice(0, 6)}...${principal.slice(-4)}` : ""}
                </span>
                <button onClick={logout} className="btn-secondary text-sm">
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
