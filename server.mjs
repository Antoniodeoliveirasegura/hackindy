import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { APIError } from "better-auth/api";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth, enabledSocialProviders } from "./auth.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

/** When set (e.g. http://localhost:5173), OAuth and resets redirect into the Vite app instead of static HTML. */
const clientAppUrl = (process.env.CLIENT_APP_URL || "").replace(/\/$/, "");
const dashboardPath = "/dashboard";
const oauthSuccessUrl = clientAppUrl
  ? `${clientAppUrl}${dashboardPath}`
  : "/index.html";
const oauthErrorUrl = clientAppUrl
  ? `${clientAppUrl}/login?error=social`
  : "/login.html?error=social";

function setResponseHeaders(res, headers) {
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.append("set-cookie", value);
      return;
    }
    res.setHeader(key, value);
  });
}

async function sendWebResponse(res, response) {
  setResponseHeaders(res, response.headers);
  const body = Buffer.from(await response.arrayBuffer());
  res.status(response.status).send(body);
}

function sendApiError(res, error) {
  if (error instanceof APIError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        status: error.status,
      },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: {
      message: "Unexpected server error",
      status: 500,
    },
  });
}

app.all("/api/auth/*", toNodeHandler(auth.handler));
app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/auth-config", (_req, res) => {
  res.json({
    socialProviders: enabledSocialProviders,
  });
});

app.get("/api/session", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    res.json({
      authenticated: Boolean(session?.user),
      session: session ?? null,
    });
  } catch (error) {
    sendApiError(res, error);
  }
});

app.post("/api/sign-out", async (req, res) => {
  try {
    const response = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    await sendWebResponse(res, response);
  } catch (error) {
    sendApiError(res, error);
  }
});

app.get("/auth/social/:provider", async (req, res) => {
  const provider = req.params.provider;

  if (!enabledSocialProviders.includes(provider)) {
    return res.status(400).json({
      error: {
        message: `${provider} sign-in is not configured on this server.`,
        status: 400,
      },
    });
  }

  try {
    const result = await auth.api.signInSocial({
      headers: fromNodeHeaders(req.headers),
      body: {
        provider,
        callbackURL: oauthSuccessUrl,
        errorCallbackURL: oauthErrorUrl,
      },
    });

    if (!result?.url) {
      return res.status(500).json({
        error: {
          message: "Social sign-in did not return a redirect URL.",
          status: 500,
        },
      });
    }

    return res.redirect(result.url);
  } catch (error) {
    return sendApiError(res, error);
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

app.listen(port, host, () => {
  console.log(`HackIndy HTML app listening on http://${host}:${port}`);
});
