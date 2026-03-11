import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useLaunchpad } from "../lib/useLaunchpad";
import { useTheme } from "../lib/theme";
import { useNotifications } from "../lib/notificationsStore";
import { formatCycles } from "../lib/formatCycles";
import { getLowCyclesThreshold } from "../lib/cycleAlertsStore";
import { CopyButton } from "./CopyButton";
import { useKeyboardShortcuts } from "../lib/useKeyboardShortcuts";

export default function HUDSidebar() {
  const { isAuthenticated, principal, logout, login } = useAuth();
  const { balance, hasCanisterIds } = useLaunchpad();
  const { theme, toggle } = useTheme();
  const { notifications, dismiss, clear, add } = useNotifications();
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const lowThreshold = getLowCyclesThreshold();
  const lowCycles = balance != null && balance < lowThreshold;
  const lowAlertShown = useRef(false);
  useEffect(() => {
    if (lowCycles && hasCanisterIds && !lowAlertShown.current) {
      lowAlertShown.current = true;
      const t = Number(lowThreshold / BigInt(1e12));
      add({ type: "warning", title: "Low cycles", message: `Wallet has less than ${t} T cycles. Consider topping up.` });
    }
    if (!lowCycles) lowAlertShown.current = false;
  }, [lowCycles, hasCanisterIds, add]);

  useKeyboardShortcuts(
    [
      { key: "?", handler: () => setShowHelp((s) => !s) },
      { key: "k", ctrl: true, handler: () => setShowHelp(true) },
      { key: "Escape", handler: () => { setShowHelp(false); setShowNotifs(false); } },
    ],
    true
  );

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "▣" },
    { to: "/wallet", label: "Wallet", icon: "◇" },
    { to: "/canisters", label: "Canisters", icon: "◈" },
    { to: "/deploy", label: "Deploy", icon: "⬡" },
    { to: "/agents", label: "Agents", icon: "🤖" },
    { to: "/milady", label: "Milady AI", icon: "✨" },
    { to: "/secrets", label: "Secrets", icon: "🔐" },
    { to: "/income", label: "Income", icon: "💰" },
    { to: "/integrations", label: "Integrations", icon: "⬢" },
    { to: "/explorer", label: "Explorer", icon: "⊞" },
    { to: "/docs", label: "Docs", icon: "📖", external: true },
  ];

  return (
    <aside className="hud-sidebar">
      <div className="hud-sidebar-inner">
        <div className="hud-brand">
          <span className="hud-logo">◈</span>
          <span className="hud-title">Launchpad</span>
        </div>

        {isAuthenticated && (
          <>
            <div className="hud-section">
              <div className="hud-cycles" title={`${formatCycles(balance, { compact: false })}`}>
                <span className="hud-cycles-label">Cycles</span>
                <span className={`hud-cycles-value ${lowCycles ? "text-amber-400" : "text-ic-green"}`}>
                  {hasCanisterIds ? formatCycles(balance, { suffix: false }) : "—"}
                </span>
                {lowCycles && <span className="hud-alert">!</span>}
              </div>
              {principal && (
                <div className="hud-principal" title={principal}>
                  <code className="font-mono text-xs truncate">{principal.slice(0, 8)}…{principal.slice(-4)}</code>
                  <CopyButton text={principal} label="Copy" className="ml-1 !p-0.5 !text-[10px]" />
                </div>
              )}
            </div>

            <nav className="hud-nav">
              {navItems.map((item) =>
                "external" in item && item.external ? (
                  <a
                    key={item.to}
                    href={`#${item.to}`}
                    className="hud-nav-link"
                  >
                    <span className="hud-nav-icon">{item.icon}</span>
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `hud-nav-link ${isActive ? "hud-nav-active" : ""}`}
                  >
                    <span className="hud-nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                )
              )}
            </nav>
          </>
        )}

        <div className="hud-footer">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNotifs((s) => !s)}
              className="hud-icon-btn relative"
              title="Notifications"
            >
              <span>🔔</span>
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-ic-green text-ic-dark text-[10px] font-bold flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            <button type="button" onClick={toggle} className="hud-icon-btn" title={`Theme: ${theme}`}>
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button type="button" onClick={() => setShowHelp(true)} className="hud-icon-btn" title="Shortcuts (?)">
              ?
            </button>
          </div>
          {isAuthenticated ? (
            <button type="button" onClick={logout} className="hud-logout">
              Logout
            </button>
          ) : (
            <button type="button" onClick={login} className="hud-login">
              Login
            </button>
          )}
        </div>
      </div>

      {showHelp && (
        <div className="hud-overlay" onClick={() => setShowHelp(false)}>
          <div className="hud-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-3">Keyboard shortcuts</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li><kbd>?</kbd> or <kbd>Ctrl+K</kbd> — Show this help</li>
              <li><kbd>Esc</kbd> — Close</li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="btn-secondary mt-4">Close</button>
          </div>
        </div>
      )}

      {showNotifs && notifications.length > 0 && (
        <div className="hud-overlay" onClick={() => setShowNotifs(false)}>
          <div className="hud-modal hud-notifications" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button onClick={clear} className="text-xs text-gray-500 hover:text-ic-green">Clear all</button>
            </div>
            <ul className="space-y-2 max-h-64 overflow-auto">
              {[...notifications].reverse().map((n) => (
                <li
                  key={n.id}
                  className={`p-3 rounded-lg border text-sm ${
                    n.type === "error" ? "border-red-500/50 bg-red-500/10" :
                    n.type === "warning" ? "border-amber-500/50 bg-amber-500/10" :
                    n.type === "success" ? "border-ic-green/50 bg-ic-green/10" :
                    "border-ic-border bg-ic-panel"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{n.title}</span>
                    <button onClick={() => dismiss(n.id)} className="text-gray-500 hover:text-white">×</button>
                  </div>
                  {n.message && <p className="text-gray-400 mt-1">{n.message}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </aside>
  );
}
