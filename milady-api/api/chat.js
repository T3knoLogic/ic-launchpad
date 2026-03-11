async function groqChat(userText, apiKey, model, agentName) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are ${agentName}, a helpful and friendly AI assistant. Keep responses concise and conversational.`,
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const text = body?.text?.trim();
  if (!text) return res.status(400).json({ error: "text is required" });

  const agentName = process.env.AGENT_NAME || "Milady";
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (apiKey) {
    try {
      const reply = await groqChat(text, apiKey, process.env.GROQ_MODEL, agentName);
      return res.status(200).json({ text: reply, agentName });
    } catch (err) {
      console.error("[groq]", err);
      return res.status(503).json({
        text: "AI service temporarily unavailable. Please try again.",
        agentName,
      });
    }
  }

  res.status(200).json({
    text: `[Echo] You said: ${text}. Add GROQ_API_KEY for real AI replies.`,
    agentName,
  });
}
