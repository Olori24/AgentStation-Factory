import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const url = String(process.env.DATABASE_URL || "").trim();
if (!url) throw new Error("DATABASE_URL is required for database migrations");

const pool = new Pool({ connectionString: url, max: 2 });
const migrationsDir = path.resolve(process.cwd(), "db", "migrations");

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set((await pool.query("SELECT filename FROM schema_migrations")).rows.map((row) => row.filename));
  const files = (await fs.readdir(migrationsDir))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();

  for (const filename of files) {
    if (applied.has(filename)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, filename), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration failed: ${filename}: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
