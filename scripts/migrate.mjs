import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("Database migration skipped: DATABASE_URL is not configured.");
  process.exit(0);
}

const db = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 15,
  idle_timeout: 5,
  ssl: databaseUrl.includes("sslmode=require") ? "require" : false,
});

try {
  const migration = fileURLToPath(
    new URL("../db/migrations/001_initial.sql", import.meta.url),
  );
  await db.file(migration);
  console.log("Database migration 001_initial applied.");
} finally {
  await db.end({ timeout: 5 });
}
