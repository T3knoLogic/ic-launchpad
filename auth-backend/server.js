/**
 * ICP Launchpad — OAuth callback backend.
 * Exchanges auth code for tokens, fetches user id/name, redirects to frontend with ?linked=provider&external_id=...&username=...
 * Set FRONTEND_URL (e.g. http://localhost:5173) and provider client ID/secret in .env.
 */
import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3030;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const INTEGRATIONS_CALLBACK = `${FRONTEND_URL}/integrations`;

const providers = {
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
  },
  github: {
    auth: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    userinfo: "https://api.github.com/user",
  },
  discord: {
    auth: "https://discord.com/api/oauth2/authorize",
    token: "https://discord.com/api/oauth2/token",
    scope: "identify email",
    userinfo: "https://discord.com/api/users/@me",
  },
};

function redirectBack(provider, error, external_id, username) {
  const params = new URLSearchParams();
  if (error) params.set("error", error);
  else {
    params.set("linked", provider);
    params.set("external_id", external_id || "");
    params.set("username", username || "");
  }
  return `${INTEGRATIONS_CALLBACK}?${params.toString()}`;
}

app.get("/auth/:provider", (req, res) => {
  const { provider } = req.params;
  const config = providers[provider];
  if (!config) return res.status(404).send("Unknown provider");
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  if (!clientId) return res.redirect(redirectBack(provider, `Set ${provider.toUpperCase()}_CLIENT_ID in auth-backend/.env`));
  const url = new URL(config.auth);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${getBaseUrl(req)}/auth/${provider}/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  if (provider === "github") url.searchParams.set("accept", "application/json");
  res.redirect(url.toString());
});

app.get("/auth/:provider/callback", async (req, res) => {
  const { provider } = req.params;
  const { code, error } = req.query;
  const config = providers[provider];
  if (!config) return res.redirect(redirectBack(provider, "Unknown provider"));
  if (error) return res.redirect(redirectBack(provider, String(error)));
  if (!code) return res.redirect(redirectBack(provider, "No code"));

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return res.redirect(redirectBack(provider, `Set ${provider.toUpperCase()}_CLIENT_ID and _CLIENT_SECRET`));

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/${provider}/callback`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: String(code),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (provider === "github") body.set("accept", "application/json");

  const tokenRes = await fetch(config.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) return res.redirect(redirectBack(provider, tokenJson.error_description || tokenJson.error || "No access_token"));

  const userRes = await fetch(config.userinfo, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userRes.json();

  let external_id, username;
  if (provider === "google") {
    external_id = user.sub;
    username = user.name || user.email || user.sub?.slice(0, 8);
  } else if (provider === "github") {
    external_id = String(user.id);
    username = user.login || user.name || user.login;
  } else if (provider === "discord") {
    external_id = user.id;
    username = user.username || user.global_name || user.id;
  } else {
    external_id = user.id || user.sub;
    username = user.name || user.login || user.username || external_id;
  }

  res.redirect(redirectBack(provider, null, external_id, username));
});

function getBaseUrl(req) {
  const host = req.get("host") || `localhost:${PORT}`;
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  return `${proto}://${host}`;
}

app.listen(PORT, () => {
  console.log(`Launchpad auth backend: http://localhost:${PORT}`);
  console.log(`FRONTEND_URL=${FRONTEND_URL} → callbacks to ${INTEGRATIONS_CALLBACK}`);
});
