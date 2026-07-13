// Runs before any test module is imported. Ensures the Prisma client and
// config pick up test-appropriate values.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://ticketing:ticketing@localhost:5432/ticketing_test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:8080";
process.env.SMTP_HOST = process.env.SMTP_HOST ?? "localhost";
