import { Outlet, NavLink } from "react-router-dom";

const SIDEBAR = [
  { path: "/docs", label: "Introduction" },
  { path: "/docs/getting-started", label: "Getting started" },
  { path: "/docs/wallet", label: "Wallet" },
  { path: "/docs/registry", label: "Registry" },
  { path: "/docs/deploy", label: "Deploy" },
  { path: "/docs/cursor-mcp", label: "Cursor & MCP" },
  { path: "/docs/reference", label: "Reference" },
  { path: "/docs/integrations", label: "Integrations" },
];

export default function DocsLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ic-dark">
      <header className="border-b border-ic-border bg-ic-panel/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="font-display font-bold text-xl text-white">
            ICP Launchpad
          </NavLink>
          <nav className="flex items-center gap-6">
            <NavLink to="/docs" className={({ isActive }) => (isActive ? "text-ic-green" : "text-gray-400 hover:text-white")}>
              Documentation
            </NavLink>
            <NavLink to="/dashboard" className="text-gray-400 hover:text-white">
              App
            </NavLink>
          </nav>
        </div>
      </header>
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <aside className="w-56 shrink-0 border-r border-ic-border py-6 pl-4 pr-2 hidden md:block">
          <nav className="sticky top-24 space-y-0.5">
            {SIDEBAR.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/docs"}
                className={({ isActive }) =>
                  "block py-2 px-3 rounded-lg text-sm " + (isActive ? "bg-ic-panel text-ic-green font-medium" : "text-gray-400 hover:text-white hover:bg-ic-panel/50")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 py-8 px-6 md:px-10">
          <article className="max-w-3xl">
            <Outlet />
          </article>
        </main>
      </div>
    </div>
  );
}
