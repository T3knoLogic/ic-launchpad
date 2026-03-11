import { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useLaunchpad } from "../lib/useLaunchpad";
import { formatCycles } from "../lib/formatCycles";
import { CopyButton } from "../components/CopyButton";
import { loadCycleAlerts, saveCycleAlerts } from "../lib/cycleAlertsStore";
import { usePlugWallet } from "../lib/usePlugWallet";
import { useNotifications } from "../lib/notificationsStore";
import { canisterIds } from "../declarations";

export default function Wallet() {
  const { balance, error, refreshBalance, hasCanisterIds } = useLaunchpad();
  const walletId = canisterIds.launchpad_wallet?.trim() ?? "";
  const [alerts, setAlerts] = useState(loadCycleAlerts);
  const [depositAmount, setDepositAmount] = useState("1"); // T cycles
  const [depositing, setDepositing] = useState(false);

  const whitelist = walletId ? [walletId] : [];
  const plug = usePlugWallet(whitelist);
  const { add: addNotification } = useNotifications();

  // Auto-refresh on window focus (nns-dapp / plug pattern)
  const onFocus = useCallback(() => {
    if (hasCanisterIds) refreshBalance();
  }, [hasCanisterIds, refreshBalance]);

  useEffect(() => {
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [onFocus]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Wallet</h1>
      {error && <div className="card border-red-500/50 text-red-400 mb-6">{error}</div>}

      {/* Balance card — nns-dapp / oisy style */}
      <div className="card max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Launchpad cycles</h2>
          <button onClick={refreshBalance} className="text-gray-500 hover:text-ic-green text-sm transition">
            Refresh
          </button>
        </div>
        <p className="text-4xl font-mono font-semibold text-ic-green mb-1">{formatCycles(balance)}</p>
        <p className="text-gray-500 text-sm">
          Cycles held by the Launchpad Wallet canister. Use them to create and top up canisters.
        </p>
      </div>

      {/* Wallet address / canister ID — plug-style copy */}
      {walletId && (
        <div className="card max-w-2xl mb-8">
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Wallet canister ID</h2>
          <p className="text-gray-500 text-sm mb-2">
            Send cycles to this canister via <code className="text-ic-green">wallet_receive</code> or dfx.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-white font-mono text-sm bg-ic-dark px-3 py-2 rounded border border-ic-border truncate max-w-full">
              {walletId}
            </code>
            <CopyButton text={walletId} />
          </div>
        </div>
      )}

      {/* Cycle alerts & auto top-up */}
      <div className="card max-w-2xl mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Cycle alerts & auto top-up</h2>
        <p className="text-gray-400 text-sm mb-4">Configure when you're alerted for low cycles and optional one-click top-up for canisters.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Low cycles threshold (G)</label>
            <input
              type="number"
              value={alerts.thresholdG}
              onChange={(e) => {
                const v = Number(e.target.value) || 500;
                setAlerts((a) => ({ ...a, thresholdG: v }));
                saveCycleAlerts({ thresholdG: v });
              }}
              min={50}
              max={5000}
              className="bg-ic-dark border border-ic-border rounded-lg px-3 py-2 w-24 font-mono"
            />
            <span className="text-gray-500 text-sm ml-2">cycles (default 500G)</span>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alerts.autoTopUpEnabled}
                onChange={(e) => {
                  const v = e.target.checked;
                  setAlerts((a) => ({ ...a, autoTopUpEnabled: v }));
                  saveCycleAlerts({ autoTopUpEnabled: v });
                }}
              />
              <span className="text-gray-400 text-sm">Show one-click top-up for low canisters</span>
            </label>
          </div>
          {alerts.autoTopUpEnabled && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">Default top-up amount (T)</label>
              <input
                type="number"
                value={alerts.autoTopUpAmountT}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setAlerts((a) => ({ ...a, autoTopUpAmountT: v }));
                  saveCycleAlerts({ autoTopUpAmountT: v });
                }}
                min={0.1}
                step={0.5}
                className="bg-ic-dark border border-ic-border rounded-lg px-3 py-2 w-24 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick actions — nns-dapp / plug pattern */}
      <div className="card max-w-2xl mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/deploy" className="btn-primary">
            Deploy new canister
          </Link>
          <Link to="/canisters" className="btn-secondary">
            Top up canister
          </Link>
          <a
            href="https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Convert ICP → cycles
          </a>
        </div>
      </div>

      {/* Plug Wallet — cycle deposit via XTC burn */}
      <div className="card max-w-2xl mb-8 border-ic-green/30 bg-ic-green/5">
        <h2 className="text-lg font-semibold text-white mb-2">Plug Wallet</h2>
        <p className="text-gray-400 text-sm mb-4">
          Connect Plug and burn XTC (Cycles Token) to deposit raw cycles into your Launchpad wallet. You need XTC in Plug.
        </p>
        {plug.error && <p className="text-amber-400 text-sm mb-3">{plug.error}</p>}
        {!plug.hasPlug ? (
          <a href="https://plugwallet.ooo" target="_blank" rel="noreferrer" className="btn-primary">
            Get Plug extension
          </a>
        ) : plug.connected ? (
          <div className="space-y-3">
            <p className="text-ic-green text-sm font-mono">Connected: {plug.principalId?.slice(0, 12)}…</p>
            {walletId && (
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Amount (T cycles)</label>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="1"
                    className="bg-ic-dark border border-ic-border rounded-lg px-3 py-2 w-24 font-mono text-sm"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!walletId) return;
                    setDepositing(true);
                    const t = parseFloat(depositAmount) || 1;
                    const cycles = BigInt(Math.floor(t * 1e12));
                    const r = await plug.depositCycles(walletId, cycles);
                    setDepositing(false);
                    if (r.ok) {
                      refreshBalance();
                      addNotification({ type: "success", title: "Deposit sent", message: `${depositAmount} T cycles sent from Plug` });
                    } else if (r.error) {
                      addNotification({ type: "error", title: "Deposit failed", message: r.error });
                    }
                  }}
                  disabled={depositing}
                  className="btn-primary"
                >
                  {depositing ? "Depositing…" : "Deposit cycles"}
                </button>
              </div>
            )}
            <button onClick={plug.disconnect} className="btn-secondary text-sm">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={() => plug.connect()} className="btn-primary">
            Connect Plug
          </button>
        )}
      </div>

      {/* OISY Wallet */}
      <div className="card max-w-2xl mb-8 border-ic-green/30 bg-ic-green/5">
        <h2 className="text-lg font-semibold text-white mb-2">OISY Wallet</h2>
        <p className="text-gray-400 text-sm mb-4">
          OISY is a web-based wallet on ICP. Open OISY to manage ICP, convert to cycles, and send cycles to your Launchpad wallet.
        </p>
        {walletId && (
          <p className="text-gray-400 text-sm mb-3">
            Send cycles to this canister ID from OISY: <code className="text-ic-green font-mono">{walletId}</code>
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <a href="https://oisy.com" target="_blank" rel="noreferrer" className="btn-primary">
            Open OISY
          </a>
          <a href="https://oisy.com" target="_blank" rel="noreferrer" className="btn-secondary">
            Get OISY
          </a>
        </div>
      </div>

      {/* Get more cycles */}
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Get more cycles</h2>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside mb-4">
          <li>
            Send cycles to this canister: call <code className="text-ic-green">wallet_receive</code> (e.g. from dfx wallet).
          </li>
          <li>
            With dfx: <code className="text-ic-green">dfx wallet send {walletId} &lt;amount&gt;</code>
          </li>
          <li>
            Convert ICP to cycles: <code className="text-ic-green">dfx cycles convert --amount &lt;ICP&gt; --network ic</code>
          </li>
        </ul>
        <a
          href="https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert"
          target="_blank"
          rel="noreferrer"
          className="inline-block btn-primary"
        >
          Cycles conversion guide
        </a>
      </div>
    </div>
  );
}
