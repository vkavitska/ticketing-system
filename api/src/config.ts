/**
 * Centralized, validated configuration loaded from environment variables.
 * Importing this module fails fast if a required secret is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),

  // Auth
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7), // 7 days

  // Used to build email-verification links
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:8080",

  // Outgoing mail
  smtp: {
    host: process.env.SMTP_HOST ?? "mailhog",
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.SMTP_FROM ?? "no-reply@ticketing.local",
  },

  // Verification tokens are valid for 24 hours
  verificationTokenTtlMs: 24 * 60 * 60 * 1000,
} as const;
