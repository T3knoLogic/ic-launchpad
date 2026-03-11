#!/usr/bin/env node
/**
 * Sync canister IDs from project .env (written by dfx) to frontend/.env and Cursor mcp.json.
 * Run after: dfx deploy
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

let projectEnv = loadEnv(join(ROOT, ".env"));
const frontendExisting = loadEnv(join(ROOT, "frontend", ".env"));

const idsPath = join(ROOT, "canister-ids.local.json");
if (Object.keys(projectEnv).length === 0 && existsSync(idsPath)) {
  try {
    const ids = JSON.parse(readFileSync(idsPath, "utf8"));
    projectEnv = {
      CANISTER_ID_LAUNCHPAD_WALLET: ids.launchpad_wallet || ids.wallet || "",
      CANISTER_ID_LAUNCHPAD_REGISTRY: ids.launchpad_registry || ids.registry || "",
      CANISTER_ID_LAUNCHPAD_INTEGRATIONS: ids.launchpad_integrations || ids.integrations || "",
      CANISTER_ID_MILADY_LAUNCHPAD: ids.milady_launchpad || ids.milady || "",
    };
  } catch (_) {}
}

const trim = (s) => (typeof s === "string" ? s.replace(/^['"]|['"]$/g, "").trim() : "");
const walletId = trim(projectEnv.CANISTER_ID_LAUNCHPAD_WALLET || frontendExisting.VITE_LAUNCHPAD_WALLET_CANISTER_ID || "");
const registryId = trim(projectEnv.CANISTER_ID_LAUNCHPAD_REGISTRY || frontendExisting.VITE_LAUNCHPAD_REGISTRY_CANISTER_ID || "");
const integrationsId = trim(projectEnv.CANISTER_ID_LAUNCHPAD_INTEGRATIONS || frontendExisting.VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID || "");
const miladyId = trim(projectEnv.CANISTER_ID_MILADY_LAUNCHPAD || frontendExisting.VITE_MILADY_CANISTER_ID || "");

const frontendVars = {
  ...frontendExisting,
  VITE_LAUNCHPAD_WALLET_CANISTER_ID: walletId,
  VITE_LAUNCHPAD_REGISTRY_CANISTER_ID: registryId,
  VITE_LAUNCHPAD_INTEGRATIONS_CANISTER_ID: integrationsId,
  VITE_MILADY_CANISTER_ID: miladyId,
};

writeFileSync(join(ROOT, "frontend", ".env"), Object.entries(frontendVars).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", "utf8");
console.log("Synced frontend/.env with canister IDs");

const mcpPath = join(os.homedir(), ".cursor", "mcp.json");
if (existsSync(mcpPath)) {
  const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
  const key = mcp.mcpServers ? "mcpServers" : "mcpservers";
  const servers = mcp[key] || {};
  const launchpad = servers["ic-launchpad"];
  if (launchpad && (walletId || registryId)) {
    const env = launchpad.env || {};
    if (walletId) env.LAUNCHPAD_WALLET_CANISTER_ID = walletId;
    if (registryId) env.LAUNCHPAD_REGISTRY_CANISTER_ID = registryId;
    env.DFX_NETWORK = projectEnv.DFX_NETWORK || "local";
    launchpad.env = env;
    mcp[key] = servers;
    writeFileSync(mcpPath, JSON.stringify(mcp, null, 2), "utf8");
    console.log("Synced Cursor mcp.json with canister IDs");
  }
}
