import "dotenv/config";
import { webcrypto } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const dataDir = process.env.AUTH_DATA_DIR || path.join(os.tmpdir(), "hackindy-auth");
const databasePath = path.join(dataDir, "auth.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const socialProviders = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  };
}

export const enabledSocialProviders = Object.keys(socialProviders);

export const auth = betterAuth({
  appName: "Purdue Indy Hub",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "better-auth-secret-12345678901234567890",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  database: new Database(databasePath),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(
        `[better-auth] Password reset requested for ${user.email}: ${url}`,
      );
    },
  },
  socialProviders,
});
