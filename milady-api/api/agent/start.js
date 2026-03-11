export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  res.status(200).json({
    ok: true,
    status: {
      state: "running",
      agentName: process.env.AGENT_NAME || "Milady",
      model: process.env.GROQ_API_KEY ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile") : "echo",
      uptime: 0,
      startedAt: Date.now(),
    },
  });
}
