#!/usr/bin/env node
/**
 * Launchpad Bridge — Deploy to Render/Railway/Fly.io so Income & Secrets work from mainnet.
 *
 * Env vars:
 *   GUMROAD_ACCESS_TOKEN     — Gumroad API token
 *   SHOPIFY_ACCESS_TOKEN     — Shopify Admin API token
 *   SHOPIFY_DOMAIN           — e.g. your-store.myshopify.com
 *   BRIDGE_API_KEY           — Required for /api/income and /secrets (use a strong secret)
 *
 * Deploy: Render, Railway, or Fly.io. Set env vars in dashboard.
 * CORS allows *.ic0.app and *.icp0.io.
 */
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { promisify } from "util";
import { execFile } from "child_process";
import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { verifyIcpLedgerTransfer } from "./ledgerVerify.mjs";
import { verifyLaunchpadDelegationAuth } from "./delegationAuth.mjs";

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 3848;
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY?.trim();
const SECRETS_FILE = process.env.SECRETS_FILE || path.join(process.cwd(), ".env.bridge");
const LAUNCHPAD_STATE_FILE =
  process.env.LAUNCHPAD_STATE_FILE || path.join(process.cwd(), ".launchpad-state.json");
const SESSION_SECRET =
  process.env.LAUNCHPAD_SESSION_SECRET?.trim() || process.env.BRIDGE_API_KEY?.trim() || "";
const SESSION_TTL_SEC = Number(process.env.LAUNCHPAD_SESSION_TTL_SEC || "1800");
const CHALLENGE_TTL_SEC = Number(process.env.LAUNCHPAD_CHALLENGE_TTL_SEC || "300");
const INTENT_TTL_MIN = Number(process.env.LAUNCHPAD_INTENT_TTL_MIN || "30");
const MAX_CANISTERS_PER_PRINCIPAL = Number(
  process.env.LAUNCHPAD_MAX_CANISTERS_PER_PRINCIPAL || "5",
);
const MAX_CYCLES_T_PER_INTENT = Number(
  process.env.LAUNCHPAD_MAX_CYCLES_T_PER_INTENT || "5",
);
const MAX_CYCLES_T_PER_DAY = Number(
  process.env.LAUNCHPAD_MAX_CYCLES_T_PER_DAY || "25",
);
const ALLOW_MOCK_PROVISION = /^true$/i.test(
  process.env.LAUNCHPAD_ALLOW_MOCK_PROVISION || "",
);
const PROVISION_WEBHOOK_URL = process.env.LAUNCHPAD_PROVISION_WEBHOOK_URL?.trim();
const PROVISION_SCRIPT = process.env.LAUNCHPAD_PROVISION_SCRIPT?.trim();
const TOPUP_APPLY_WEBHOOK_URL = process.env.LAUNCHPAD_TOPUP_APPLY_WEBHOOK_URL?.trim();
const TOPUP_APPLY_SCRIPT = process.env.LAUNCHPAD_TOPUP_APPLY_SCRIPT?.trim();
const IC_HOST = process.env.LAUNCHPAD_IC_HOST?.trim() || "https://icp0.io";
const CMC_CANISTER_ID =
  process.env.LAUNCHPAD_CMC_CANISTER_ID?.trim() || "rkp4c-7iaaa-aaaaa-aaaca-cai";
const ICP_PER_TCYCLES_OVERRIDE = process.env.LAUNCHPAD_ICP_PER_TCYCLES_OVERRIDE?.trim() || "";
const LAUNCHPAD_ALLOWED_ORIGINS = (process.env.LAUNCHPAD_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
/** If set (1/true/yes/strict), topup-finalize verifies ICP Ledger block before apply script. */
const LAUNCHPAD_LEDGER_VERIFY = /^1|true|yes|strict$/i.test(
  process.env.LAUNCHPAD_LEDGER_VERIFY || "",
);

const ICP_ORIGINS = /^https:\/\/[a-z0-9-]+\.(ic0\.app|icp0\.io)$/;
const allowedOrigins = (process.env.BRIDGE_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (LAUNCHPAD_ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (ICP_ORIGINS.test(origin)) return cb(null, true);
      if (allowedOrigins.length === 0 && LAUNCHPAD_ALLOWED_ORIGINS.length === 0) return cb(null, true);
      cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Bridge-Key",
      "X-Launchpad-Session",
      "X-Idempotency-Key",
    ],
  })
);

function loadJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

const state = loadJsonFile(LAUNCHPAD_STATE_FILE, {
  challenges: {},
  sessions: {},
  principals: {},
  intents: {},
  idempotency: {},
});

function persistState() {
  saveJsonFile(LAUNCHPAD_STATE_FILE, state);
}

function nowMs() {
  return Date.now();
}

function randomId(prefix = "id") {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

/** Deterministic nat64 memo for ICP Ledger transfer (matches client intent display). */
function memoNatFromIntentId(intentId) {
  const h = crypto.createHash("sha256").update(intentId).digest();
  const n = h.readBigUInt64BE(0);
  const masked = n & ((1n << 64n) - 1n);
  return masked.toString();
}

function hmacHex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function createSessionToken(payload) {
  if (!SESSION_SECRET) throw new Error("LAUNCHPAD_SESSION_SECRET or BRIDGE_API_KEY is required.");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmacHex(SESSION_SECRET, body);
  return `${body}.${sig}`;
}

function parseSessionToken(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = hmacHex(SESSION_SECRET, body);
  if (
    !crypto.timingSafeEqual(
      Buffer.from(sig, "utf8"),
      Buffer.from(expected, "utf8"),
    )
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function cleanupState() {
  const now = nowMs();
  for (const [id, c] of Object.entries(state.challenges)) {
    if (c.expires_at_ms <= now) delete state.challenges[id];
  }
  for (const [id, s] of Object.entries(state.sessions)) {
    if (s.expires_at_ms <= now) delete state.sessions[id];
  }
  for (const [key, v] of Object.entries(state.idempotency)) {
    if (v.expires_at_ms <= now) delete state.idempotency[key];
  }
}

setInterval(() => {
  cleanupState();
  persistState();
}, 30_000).unref();

const requestsByIp = new Map();
function rateLimit(routeKey, maxPerMin) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `${routeKey}|${ip}`;
    const now = nowMs();
    const bucket = requestsByIp.get(key) || [];
    const fresh = bucket.filter((t) => now - t < 60_000);
    fresh.push(now);
    requestsByIp.set(key, fresh);
    if (fresh.length > maxPerMin) {
      return res.status(429).json({ ok: false, error: "Rate limit exceeded" });
    }
    next();
  };
}

function isValidPrincipalText(v) {
  try {
    Principal.fromText(String(v || "").trim());
    return true;
  } catch {
    return false;
  }
}

function isValidWalletKind(v) {
  return v === "plug" || v === "oisy" || v === "ii";
}

function isValidCyclesText(v) {
  return /^\d+(\.\d+)?$/.test(String(v || "").trim());
}

function toCyclesT(v) {
  return Number(String(v || "0").trim());
}

function readAuthToken(req) {
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const custom = String(req.headers["x-launchpad-session"] || "").trim();
  return custom || bearer;
}

function requireLaunchpadAuth(req, res, next) {
  const bridgeKey =
    req.headers["x-bridge-key"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (BRIDGE_API_KEY && bridgeKey === BRIDGE_API_KEY) {
    req.launchpadAuth = { type: "bridge_key", principal: null, wallet_kind: "ii" };
    return next();
  }

  const token = readAuthToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing launchpad auth token" });
  }
  const decoded = parseSessionToken(token);
  if (!decoded) {
    return res.status(401).json({ ok: false, error: "Invalid launchpad session token" });
  }
  if (decoded.exp * 1000 <= nowMs()) {
    return res.status(401).json({ ok: false, error: "Launchpad session expired" });
  }
  req.launchpadAuth = {
    type: "wallet_session",
    principal: decoded.principal,
    wallet_kind: decoded.wallet_kind,
  };
  next();
}

function requireAuth(req, res, next) {
  if (!BRIDGE_API_KEY) {
    return res.status(503).json({ ok: false, error: "BRIDGE_API_KEY not configured" });
  }
  const key = req.headers["x-bridge-key"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (key !== BRIDGE_API_KEY) {
    return res.status(401).json({ ok: false, error: "Invalid or missing API key" });
  }
  next();
}

function parseJsonLine(stdout) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // continue
    }
  }
  return null;
}

function stableIntentKey(principal, canisterId, cyclesT, idemKey) {
  return `${principal}|${canisterId}|${cyclesT}|${idemKey || ""}`;
}

function ensurePrincipalRecord(principal) {
  if (!state.principals[principal]) {
    state.principals[principal] = {
      canisters: [],
      daily_usage: {},
    };
  }
  return state.principals[principal];
}

function dayKeyFromMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

const CMC_IDL = ({ IDL }) =>
  IDL.Service({
    get_icp_xdr_conversion_rate: IDL.Func(
      [],
      [
        IDL.Record({
          data: IDL.Record({
            timestamp_seconds: IDL.Nat64,
            xdr_permyriad_per_icp: IDL.Nat64,
          }),
          hash_tree: IDL.Vec(IDL.Nat8),
          certificate: IDL.Vec(IDL.Nat8),
        }),
      ],
      ["query"],
    ),
  });

let cmcRateCache = {
  atMs: 0,
  payload: null,
};

function formatIcpPerTCycles(permyriadBig) {
  const scale = 1_000_000_000n; // 9 decimals
  const v = (10_000n * scale) / permyriadBig; // ICP per 1T cycles
  const whole = v / scale;
  const frac = (v % scale).toString().padStart(9, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

async function fetchIcpPerTCyclesFromCmc() {
  const now = nowMs();
  if (cmcRateCache.payload && now - cmcRateCache.atMs < 60_000) {
    return cmcRateCache.payload;
  }
  const agent = new HttpAgent({ host: IC_HOST });
  const cmc = Actor.createActor(CMC_IDL, {
    agent,
    canisterId: CMC_CANISTER_ID,
  });
  const out = await cmc.get_icp_xdr_conversion_rate();
  const permyriadRaw = out?.data?.xdr_permyriad_per_icp;
  const timestampRaw = out?.data?.timestamp_seconds;
  if (permyriadRaw == null || timestampRaw == null) {
    throw new Error("CMC response missing xdr_permyriad_per_icp or timestamp_seconds");
  }
  const permyriad = BigInt(permyriadRaw.toString());
  if (permyriad <= 0n) {
    throw new Error("CMC xdr_permyriad_per_icp must be > 0");
  }
  const timestampSeconds = Number(timestampRaw.toString());
  const payload = {
    ok: true,
    icp_per_tcycles: formatIcpPerTCycles(permyriad),
    source: "cmc:get_icp_xdr_conversion_rate",
    as_of: new Date(timestampSeconds * 1000).toISOString(),
    xdr_permyriad_per_icp: permyriad.toString(),
  };
  cmcRateCache = { atMs: now, payload };
  return payload;
}

async function provisionCanisterViaProvider(payload) {
  if (PROVISION_WEBHOOK_URL) {
    const r = await fetch(PROVISION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      throw new Error(`Provision webhook failed: ${r.status} ${await r.text()}`);
    }
    return await r.json();
  }

  if (PROVISION_SCRIPT) {
    const [cmd, ...args] = PROVISION_SCRIPT.split(" ");
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      env: {
        ...process.env,
        LAUNCHPAD_PRINCIPAL: payload.principal,
        LAUNCHPAD_WALLET_KIND: payload.wallet_kind,
        LAUNCHPAD_REQUESTED_CYCLES_T: payload.requested_cycles_t || "",
      },
      timeout: 120_000,
    });
    const parsed = parseJsonLine(stdout);
    if (!parsed?.canister_id) {
      throw new Error(`Provision script did not return canister_id. ${stderr || ""}`.trim());
    }
    return parsed;
  }

  if (ALLOW_MOCK_PROVISION) {
    const fake = `mock-${hmacHex("mock", payload.principal).slice(0, 20)}-cai`;
    return { canister_id: fake };
  }

  throw new Error(
    "No provisioner configured. Set LAUNCHPAD_PROVISION_WEBHOOK_URL or LAUNCHPAD_PROVISION_SCRIPT.",
  );
}

async function applyTopupViaProvider(intent) {
  if (TOPUP_APPLY_WEBHOOK_URL) {
    const r = await fetch(TOPUP_APPLY_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
    });
    if (!r.ok) {
      throw new Error(`Top-up apply webhook failed: ${r.status} ${await r.text()}`);
    }
    return await r.json();
  }

  if (TOPUP_APPLY_SCRIPT) {
    const [cmd, ...args] = TOPUP_APPLY_SCRIPT.split(" ");
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      env: {
        ...process.env,
        LAUNCHPAD_INTENT_ID: intent.intent_id,
        LAUNCHPAD_PRINCIPAL: intent.principal,
        LAUNCHPAD_CANISTER_ID: intent.canister_id,
        LAUNCHPAD_CYCLES_T: intent.required_cycles_t,
        LAUNCHPAD_FUNDED_CYCLES_T: intent.funding?.funded_cycles_t || "",
        LAUNCHPAD_TX_HASH: intent.funding?.tx_hash || "",
      },
      timeout: 120_000,
    });
    const parsed = parseJsonLine(stdout);
    if (!parsed?.ok) {
      throw new Error(`Top-up apply script failed. ${stderr || ""}`.trim());
    }
    return parsed;
  }

  return { ok: true, mode: "record_only" };
}

// GET /health — no auth, for connectivity check
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "launchpad-bridge" });
});

app.post(
  "/api/launchpad/auth/challenge",
  rateLimit("lp_auth_challenge", 60),
  (req, res) => {
    const principal = String(req.body?.principal || "").trim();
    const walletKind = String(req.body?.wallet_kind || "").trim();
    if (!isValidPrincipalText(principal)) {
      return res.status(400).json({ ok: false, error: "Invalid principal" });
    }
    if (!isValidWalletKind(walletKind)) {
      return res.status(400).json({ ok: false, error: "Invalid wallet_kind" });
    }

    const id = randomId("chl");
    const nonce = crypto.randomBytes(16).toString("hex");
    const message = `Launchpad auth challenge\nprincipal=${principal}\nwallet=${walletKind}\nnonce=${nonce}`;
    const exp = nowMs() + CHALLENGE_TTL_SEC * 1000;
    state.challenges[id] = {
      challenge_id: id,
      principal,
      wallet_kind: walletKind,
      challenge: message,
      expires_at_ms: exp,
      used: false,
    };
    persistState();
    return res.json({
      ok: true,
      challenge_id: id,
      challenge: message,
      expires_at: new Date(exp).toISOString(),
      accepted_proof_algs: ["ed25519", "ecdsa"],
    });
  },
);

app.post(
  "/api/launchpad/auth/verify",
  rateLimit("lp_auth_verify", 60),
  (req, res) => {
    const challengeId = String(req.body?.challenge_id || "").trim();
    const principal = String(req.body?.principal || "").trim();
    const walletKind = String(req.body?.wallet_kind || "").trim();
    const proof = req.body?.proof || {};
    const c = state.challenges[challengeId];
    if (!c) return res.status(404).json({ ok: false, error: "Challenge not found" });
    if (c.used) return res.status(409).json({ ok: false, error: "Challenge already used" });
    if (c.expires_at_ms <= nowMs()) return res.status(410).json({ ok: false, error: "Challenge expired" });
    if (c.principal !== principal || c.wallet_kind !== walletKind) {
      return res.status(400).json({ ok: false, error: "Challenge principal mismatch" });
    }

    const signatureB64 = String(proof?.signature_b64 || "").trim();
    const publicKeyPem = String(proof?.public_key_pem || "").trim();
    const alg = String(proof?.alg || "").trim().toLowerCase();
    if (!signatureB64 || !publicKeyPem || !alg) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing proof fields: alg, public_key_pem, signature_b64",
      });
    }

    let isValidSig = false;
    try {
      const keyObject = crypto.createPublicKey(publicKeyPem);
      const sig = Buffer.from(signatureB64, "base64");
      const msg = Buffer.from(c.challenge, "utf8");
      if (alg === "ed25519") {
        isValidSig = crypto.verify(null, msg, keyObject, sig);
      } else if (alg === "ecdsa") {
        isValidSig = crypto.verify("sha256", msg, keyObject, sig);
      } else {
        return res.status(400).json({ ok: false, error: "Unsupported proof alg" });
      }

      const spkiDer = keyObject.export({ format: "der", type: "spki" });
      const expectedPrincipal = Principal.selfAuthenticating(new Uint8Array(spkiDer)).toText();
      if (expectedPrincipal !== principal) {
        return res.status(401).json({
          ok: false,
          error: "Signature principal does not match claimed principal",
        });
      }
    } catch (e) {
      return res.status(400).json({ ok: false, error: `Proof parse/verify failed: ${String(e.message || e)}` });
    }

    if (!isValidSig) {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    c.used = true;
    const sessionId = randomId("sess");
    const expSec = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
    const token = createSessionToken({
      sid: sessionId,
      principal,
      wallet_kind: walletKind,
      exp: expSec,
    });
    state.sessions[sessionId] = {
      principal,
      wallet_kind: walletKind,
      expires_at_ms: expSec * 1000,
    };
    persistState();
    return res.json({
      ok: true,
      token,
      expires_at: new Date(expSec * 1000).toISOString(),
    });
  },
);

app.post(
  "/api/launchpad/auth/delegation-verify",
  rateLimit("lp_auth_delegation_verify", 60),
  (req, res) => {
    const challengeId = String(req.body?.challenge_id || "").trim();
    const principal = String(req.body?.principal || "").trim();
    const walletKind = String(req.body?.wallet_kind || "").trim();
    const delegation_chain = req.body?.delegation_chain;
    const challenge_signature_b64 = String(req.body?.challenge_signature_b64 || "").trim();

    const c = state.challenges[challengeId];
    if (!c) return res.status(404).json({ ok: false, error: "Challenge not found" });
    if (c.used) return res.status(409).json({ ok: false, error: "Challenge already used" });
    if (c.expires_at_ms <= nowMs()) return res.status(410).json({ ok: false, error: "Challenge expired" });
    if (c.principal !== principal || c.wallet_kind !== walletKind) {
      return res.status(400).json({ ok: false, error: "Challenge principal mismatch" });
    }
    if (!isValidPrincipalText(principal) || !isValidWalletKind(walletKind)) {
      return res.status(400).json({ ok: false, error: "Invalid principal or wallet_kind" });
    }
    if (!delegation_chain || typeof delegation_chain !== "object") {
      return res.status(400).json({ ok: false, error: "Missing delegation_chain" });
    }
    if (!challenge_signature_b64) {
      return res.status(400).json({ ok: false, error: "Missing challenge_signature_b64" });
    }

    const v = verifyLaunchpadDelegationAuth({
      delegation_chain,
      challenge_text: c.challenge,
      challenge_signature_b64,
      expected_principal: principal,
    });
    if (!v.ok) {
      return res.status(401).json({ ok: false, error: v.error || "Delegation verification failed" });
    }

    c.used = true;
    const sessionId = randomId("sess");
    const expSec = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
    const token = createSessionToken({
      sid: sessionId,
      principal,
      wallet_kind: walletKind,
      exp: expSec,
    });
    state.sessions[sessionId] = {
      principal,
      wallet_kind: walletKind,
      expires_at_ms: expSec * 1000,
    };
    persistState();
    return res.json({
      ok: true,
      token,
      expires_at: new Date(expSec * 1000).toISOString(),
    });
  },
);

app.post(
  "/api/launchpad/rates/icp-per-tcycles",
  rateLimit("lp_rates_icp_per_tcycles", 120),
  async (req, res) => {
    try {
      if (ICP_PER_TCYCLES_OVERRIDE) {
        const n = Number(ICP_PER_TCYCLES_OVERRIDE);
        if (!Number.isFinite(n) || n <= 0) {
          return res.status(500).json({
            ok: false,
            error: "Invalid LAUNCHPAD_ICP_PER_TCYCLES_OVERRIDE; must be positive decimal",
          });
        }
        return res.json({
          ok: true,
          icp_per_tcycles: String(n),
          source: "env:LAUNCHPAD_ICP_PER_TCYCLES_OVERRIDE",
          as_of: new Date().toISOString(),
        });
      }
      const quote = await fetchIcpPerTCyclesFromCmc();
      return res.json(quote);
    } catch (e) {
      return res.status(502).json({
        ok: false,
        error: `Failed to fetch CMC ICP/XDR rate: ${String(e.message || e)}`,
      });
    }
  },
);

app.post(
  "/api/launchpad/canister/provision",
  rateLimit("lp_provision", 30),
  requireLaunchpadAuth,
  async (req, res) => {
    try {
      const principal = String(req.body?.principal || "").trim();
      const walletKind = String(req.body?.wallet_kind || "").trim();
      const requestedCyclesT = String(req.body?.requested_cycles_t || "0.25").trim();
      const authPrincipal = req.launchpadAuth?.principal;
      if (!isValidPrincipalText(principal)) {
        return res.status(400).json({ ok: false, error: "Invalid principal" });
      }
      if (!isValidWalletKind(walletKind)) {
        return res.status(400).json({ ok: false, error: "Invalid wallet_kind" });
      }
      if (!isValidCyclesText(requestedCyclesT)) {
        return res.status(400).json({ ok: false, error: "Invalid requested_cycles_t" });
      }
      if (authPrincipal && authPrincipal !== principal) {
        return res.status(403).json({ ok: false, error: "Auth principal mismatch" });
      }

      const principalRecord = ensurePrincipalRecord(principal);
      if (principalRecord.canisters.length >= MAX_CANISTERS_PER_PRINCIPAL) {
        return res.status(403).json({
          ok: false,
          error: `Canister limit reached (${MAX_CANISTERS_PER_PRINCIPAL})`,
        });
      }

      const result = await provisionCanisterViaProvider({
        principal,
        wallet_kind: walletKind,
        requested_cycles_t: requestedCyclesT,
      });
      const canisterId = String(result.canister_id || "").trim();
      if (!canisterId) {
        return res.status(502).json({ ok: false, error: "Provisioner did not return canister_id" });
      }

      if (!principalRecord.canisters.includes(canisterId)) {
        principalRecord.canisters.push(canisterId);
      }
      persistState();
      return res.json({
        canister_id: canisterId,
        owner_principal: principal,
        allocated_cycles_t: requestedCyclesT,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  },
);

app.post(
  "/api/launchpad/cycles/topup-intent",
  rateLimit("lp_topup_intent", 60),
  requireLaunchpadAuth,
  (req, res) => {
    const principal = String(req.body?.principal || "").trim();
    const walletKind = String(req.body?.wallet_kind || "").trim();
    const canisterId = String(req.body?.canister_id || "").trim();
    const cyclesT = String(req.body?.cycles_t || "").trim();
    const authPrincipal = req.launchpadAuth?.principal;
    const idemKey = String(req.headers["x-idempotency-key"] || "").trim();

    if (!isValidPrincipalText(principal)) {
      return res.status(400).json({ ok: false, error: "Invalid principal" });
    }
    if (!isValidWalletKind(walletKind)) {
      return res.status(400).json({ ok: false, error: "Invalid wallet_kind" });
    }
    if (!canisterId) {
      return res.status(400).json({ ok: false, error: "Missing canister_id" });
    }
    if (!isValidCyclesText(cyclesT)) {
      return res.status(400).json({ ok: false, error: "Invalid cycles_t" });
    }
    if (authPrincipal && authPrincipal !== principal) {
      return res.status(403).json({ ok: false, error: "Auth principal mismatch" });
    }

    const cyclesNum = toCyclesT(cyclesT);
    if (cyclesNum <= 0 || cyclesNum > MAX_CYCLES_T_PER_INTENT) {
      return res.status(400).json({
        ok: false,
        error: `cycles_t must be > 0 and <= ${MAX_CYCLES_T_PER_INTENT}`,
      });
    }

    const principalRecord = ensurePrincipalRecord(principal);
    if (!principalRecord.canisters.includes(canisterId)) {
      return res.status(403).json({ ok: false, error: "Canister is not registered to principal" });
    }

    const today = dayKeyFromMs(nowMs());
    const usedToday = Number(principalRecord.daily_usage[today] || 0);
    if (usedToday + cyclesNum > MAX_CYCLES_T_PER_DAY) {
      return res.status(403).json({
        ok: false,
        error: `Daily cycles quota exceeded (${MAX_CYCLES_T_PER_DAY}T)`,
      });
    }

    const key = stableIntentKey(principal, canisterId, cyclesT, idemKey);
    const existingId = state.idempotency[key]?.intent_id;
    if (existingId && state.intents[existingId]) {
      return res.json(state.intents[existingId]);
    }

    const intentId = randomId("intent");
    const memo_nat = memoNatFromIntentId(intentId);
    const expiresAtMs = nowMs() + INTENT_TTL_MIN * 60_000;
    const intent = {
      intent_id: intentId,
      principal,
      wallet_kind: walletKind,
      canister_id: canisterId,
      required_cycles_t: cyclesT,
      memo_nat,
      status: "created",
      created_at: new Date().toISOString(),
      expires_at: new Date(expiresAtMs).toISOString(),
      funding: null,
      finalized_at: null,
      apply_result: null,
    };
    state.intents[intentId] = intent;
    state.idempotency[key] = {
      intent_id: intentId,
      expires_at_ms: expiresAtMs,
    };
    persistState();
    return res.json({
      intent_id: intentId,
      canister_id: canisterId,
      required_cycles_t: cyclesT,
      expires_at: intent.expires_at,
      // Correlation: string memo for logs; ICP Ledger send must use memo_nat (uint64).
      memo: intentId,
      memo_nat,
    });
  },
);

app.post(
  "/api/launchpad/cycles/topup-finalize",
  rateLimit("lp_topup_finalize", 60),
  requireLaunchpadAuth,
  async (req, res) => {
    try {
      const intentId = String(req.body?.intent_id || "").trim();
      const txHash = String(req.body?.tx_hash || "").trim();
      const fundedCyclesT = String(req.body?.funded_cycles_t || "").trim();
      if (!intentId || !txHash || !fundedCyclesT || !isValidCyclesText(fundedCyclesT)) {
        return res.status(400).json({
          ok: false,
          error: "intent_id, tx_hash, funded_cycles_t are required",
        });
      }
      const intent = state.intents[intentId];
      if (!intent) return res.status(404).json({ ok: false, error: "Intent not found" });
      if (intent.status !== "created") {
        return res.status(409).json({ ok: false, error: `Intent already ${intent.status}` });
      }
      if (new Date(intent.expires_at).getTime() <= nowMs()) {
        intent.status = "expired";
        persistState();
        return res.status(410).json({ ok: false, error: "Intent expired" });
      }

      const authPrincipal = req.launchpadAuth?.principal;
      if (authPrincipal && authPrincipal !== intent.principal) {
        return res.status(403).json({ ok: false, error: "Auth principal mismatch" });
      }
      if (toCyclesT(fundedCyclesT) < toCyclesT(intent.required_cycles_t)) {
        return res.status(400).json({
          ok: false,
          error: "funded_cycles_t is lower than required intent amount",
        });
      }

      if (LAUNCHPAD_LEDGER_VERIFY) {
        try {
          await verifyIcpLedgerTransfer({
            blockIndexTxHash: txHash,
            expectedMemoNat: String(intent.memo_nat || memoNatFromIntentId(intentId)),
          });
        } catch (verErr) {
          return res.status(400).json({
            ok: false,
            error: `Ledger verification failed: ${verErr.message || verErr}`,
          });
        }
      }

      intent.status = "funded";
      intent.funding = {
        tx_hash: txHash,
        funded_cycles_t: fundedCyclesT,
        funded_at: new Date().toISOString(),
      };

      const applyResult = await applyTopupViaProvider(intent);
      intent.status = "applied";
      intent.apply_result = applyResult;
      intent.finalized_at = new Date().toISOString();

      const principalRecord = ensurePrincipalRecord(intent.principal);
      const today = dayKeyFromMs(nowMs());
      principalRecord.daily_usage[today] = Number(principalRecord.daily_usage[today] || 0) + toCyclesT(intent.required_cycles_t);

      persistState();
      return res.json({
        ok: true,
        intent_id: intent.intent_id,
        status: intent.status,
        apply_result: applyResult,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  },
);

app.get(
  "/api/launchpad/intents/:intentId",
  rateLimit("lp_intent_get", 120),
  requireLaunchpadAuth,
  (req, res) => {
    const intentId = String(req.params.intentId || "").trim();
    const intent = state.intents[intentId];
    if (!intent) return res.status(404).json({ ok: false, error: "Intent not found" });
    const authPrincipal = req.launchpadAuth?.principal;
    if (authPrincipal && authPrincipal !== intent.principal) {
      return res.status(403).json({ ok: false, error: "Auth principal mismatch" });
    }
    return res.json(intent);
  },
);

// GET /api/income — Gumroad + Shopify
app.get("/api/income", requireAuth, async (req, res) => {
  try {
    const gumroadToken = process.env.GUMROAD_ACCESS_TOKEN?.trim();
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN?.trim();
    const shopifyDomain = process.env.SHOPIFY_DOMAIN?.trim();
    const result = { gumroad: null, shopify: null };

    if (gumroadToken) {
      try {
        const r = await fetch("https://api.gumroad.com/v2/sales?limit=50", {
          headers: { Authorization: `Bearer ${gumroadToken}` },
        });
        const data = await r.json();
        result.gumroad = data.success ? data : { success: false, error: data.message || "Unknown error" };
      } catch (e) {
        result.gumroad = { success: false, error: String(e.message) };
      }
    }

    if (shopifyToken && shopifyDomain) {
      try {
        const shop = shopifyDomain.replace(".myshopify.com", "");
        const r = await fetch(
          `https://${shop}.myshopify.com/admin/api/2024-01/orders.json?limit=25&status=any`,
          { headers: { "X-Shopify-Access-Token": shopifyToken } }
        );
        const data = await r.json();
        result.shopify = data.orders ? { orders: data.orders } : { error: data.errors || "Unknown error" };
      } catch (e) {
        result.shopify = { error: String(e.message) };
      }
    }

    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message) });
  }
});

// GET /secrets — read stored secrets (file-based, works on Render/Railway/Fly)
app.get("/secrets", requireAuth, (req, res) => {
  try {
    const content = fs.existsSync(SECRETS_FILE)
      ? fs.readFileSync(SECRETS_FILE, "utf8")
      : "";
    res.json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message) });
  }
});

// POST /secrets — save (persists on platforms with disk)
app.post("/secrets", requireAuth, (req, res) => {
  try {
    const content = typeof req.body?.content === "string" ? req.body.content : String(req.body?.content ?? "");
    const dir = path.dirname(SECRETS_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SECRETS_FILE, content, "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Launchpad Bridge: http://0.0.0.0:${PORT}`);
  console.log("Endpoints: GET /health | GET/POST /secrets | GET /api/income (all need X-Bridge-Key except /health)");
});
