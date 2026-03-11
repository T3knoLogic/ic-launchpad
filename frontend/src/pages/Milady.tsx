/**
 * Interactive Milady AI agent — hosted on IC mainnet.
 * Full 3D avatar, character customization, Gemini for language models.
 * Connects to canisters across the whole IC network via plugin-icp.
 */
import { useState } from "react";
import { canisterIds } from "../declarations";

// Use icp0.io: canister created via Launchpad may not be available on ic0.app gateway
const MILADY_URL = canisterIds.milady_launchpad ? `https://${canisterIds.milady_launchpad}.icp0.io` : "";

export default function Milady() {
  const [showGatewayHelp, setShowGatewayHelp] = useState(false);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Milady AI</h1>
      <p className="text-gray-400 mb-6 max-w-2xl">
        Interactive AI assistant with 3D avatar, full character customization, and IC mainnet integration.
        Uses Gemini for language models and creative aspects. Connects to canisters across the whole IC network.
      </p>

      {MILADY_URL ? (
        <div className="space-y-6 max-w-2xl">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-3">Launch Milady</h2>
            <p className="text-gray-400 text-sm mb-4">
              Milady is hosted on IC mainnet. For full AI chat, run the gateway (Docker or cloud) and connect in Settings.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={MILADY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Open in new tab
              </a>
              <button
                onClick={() => setShowGatewayHelp((s) => !s)}
                className="btn-secondary"
              >
                {showGatewayHelp ? "Hide" : "Show"} gateway help
              </button>
            </div>

            <div className="mt-4 rounded-lg overflow-hidden border border-ic-border" style={{ minHeight: "70vh" }}>
              <iframe
                src={MILADY_URL}
                title="Milady AI"
                className="w-full border-0"
                style={{ height: "75vh", minHeight: "500px" }}
              />
            </div>

            {showGatewayHelp && (
              <div className="mt-4 p-4 rounded-lg bg-ic-panel/50 border border-ic-border text-sm">
                <p className="text-gray-300 mb-2">
                  To enable AI chat, run the Milady gateway and paste its WebSocket URL:
                </p>
                <code className="block mb-2 p-2 bg-ic-dark rounded text-ic-green font-mono text-xs break-all">
                  ws://localhost:18789/ws  (local) or wss://your-gateway.example.com/ws
                </code>
                <p className="text-gray-500 text-xs">
                  Deploy via Agents page: <strong>Milady AI</strong> → Deploy
                </p>
              </div>
            )}

            <p className="text-gray-500 text-sm mt-2">
              Configure the gateway URL in Milady Settings → Connection after opening.
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-2">Features</h2>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>3D VRM avatar (8 built-in + custom upload)</li>
              <li>Full character customization: name, bio, personality, style</li>
              <li>Gemini API for language models and creative generation</li>
              <li>plugin-icp: Launchpad wallet, registry, whole IC network</li>
              <li>Query cycles balance, list registered canisters, create tokens</li>
              <li>T3kNo-Logic products: query NFT Matrix, Machina, Bonsai Widget, Bazaar</li>
              <li>Draft Twitter/Discord posts for products (with product links)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-3">Deploy Milady first</h2>
          <p className="text-gray-400 text-sm mb-4">
            Build and deploy the Milady canister, then add its ID to <code className="text-ic-green">frontend/.env</code>:
          </p>
          <pre className="p-4 rounded-lg bg-ic-dark text-ic-green font-mono text-xs overflow-x-auto">
            VITE_MILADY_CANISTER_ID=&lt;milady_launchpad canister id&gt;
          </pre>
          <p className="text-gray-500 text-sm mt-3">
            Run from <code className="text-ic-green">ic-launchpad</code>:<br />
            <code className="text-ic-green">bash scripts/build-milady-for-icp.sh</code><br />
            <code className="text-ic-green">dfx deploy milady_launchpad --network ic</code>
          </p>
        </div>
      )}
    </div>
  );
}
