import { execSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;

const ADMIN_URL =
  process.env.TEST_ADMIN_URL ??
  "postgresql://ticketing:ticketing@localhost:5432/postgres";
const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://ticketing:ticketing@localhost:5432/ticketing_test";

/**
 * Recreates a clean `ticketing_test` database and applies migrations to it.
 * Requires the PostgreSQL container (docker compose) to be running.
 */
export default async function setup(): Promise<void> {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  // Drop any leftover connections, then recreate the database fresh.
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ticketing_test' AND pid <> pg_backend_pid()`,
  );
  await client.query("DROP DATABASE IF EXISTS ticketing_test");
  await client.query("CREATE DATABASE ticketing_test");
  await client.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: "inherit",
  });
}
