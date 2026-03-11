#!/usr/bin/env node
/**
 * Minimal Milady API for ICP Launchpad.
 * Serves /api/status, /api/agent/start, /api/agent/stop, /api/chat
 * Compatible with the Milady frontend Agent plugin.
 *
 * Deploy to Render/Railway/Fly.io. Set MILADY_ALLOWED_ORIGINS for CORS
 * (e.g. https://q2k6b-yiaaa-aaaau-afpna-cai.icp0.io)
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const PORT = Number(process.env.PORT) || 3000;
const AGENT_NAME = process.env.AGENT_NAME || "Milady";
const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Allow ICP gateway origins (canister IDs vary)
const ICP_ORIGINS = /^https:\/\/[a-z0-9-]+\.icp0\.io$/;
const allowedOrigins = (process.env.MILADY_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (ICP_ORIGINS.test(origin)) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      cb(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Milady-Token",
      "X-Api-Key",
      "Accept",
    ],
  })
);

let agentState = "running";
let startedAt = Date.now();

function getUptime() {
  return startedAt != null ? Date.now() - startedAt : undefined;
}

// GET /api/status
app.get("/api/status", (req, res) => {
  res.json({
    state: agentState,
    agentName: AGENT_NAME,
    model: GROQ_API_KEY ? GROQ_MODEL : "echo",
    uptime: getUptime(),
    startedAt: agentState === "running" ? startedAt : null,
    port: PORT,
    error: null,
  });
});

// POST /api/agent/start
app.post("/api/agent/start", (req, res) => {
  agentState = "running";
  startedAt = Date.now();
  res.json({
    ok: true,
    status: {
      state: agentState,
      agentName: AGENT_NAME,
      model: GROQ_API_KEY ? GROQ_MODEL : "echo",
      uptime: 0,
      startedAt,
    },
  });
});

// POST /api/agent/stop
app.post("/api/agent/stop", (req, res) => {
  agentState = "stopped";
  startedAt = null;
  res.json({ ok: true, status: { state: agentState, agentName: AGENT_NAME } });
});

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  const text = req.body?.text?.trim();
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  if (GROQ_API_KEY) {
    try {
      const reply = await groqChat(text);
      return res.json({ text: reply, agentName: AGENT_NAME });
    } catch (err) {
      console.error("[groq]", err);
      return res.status(503).json({
        text: "AI service temporarily unavailable. Please try again.",
        agentName: AGENT_NAME,
      });
    }
  }

  res.json({
    text: `[Echo] You said: ${text}. Add GROQ_API_KEY for real AI replies.`,
    agentName: AGENT_NAME,
  });
});

async function groqChat(userText) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: `You are ${AGENT_NAME}, a helpful and friendly AI assistant. Keep responses concise and conversational.`,
        },
        { role: "user", content: userText },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || "(No response)";
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", agentState });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[milady-api] Listening on :${PORT} (agent: ${AGENT_NAME}, AI: ${GROQ_API_KEY ? GROQ_MODEL : "echo"})`
  );
  if (allowedOrigins.length) {
    console.log("[milady-api] CORS allowed origins:", allowedOrigins.join(", "));
  }
});
