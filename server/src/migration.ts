import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), "src", "migrations");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort(); // important: run in order

  if (files.length === 0) {
    console.log("No migrations found");
    return;
  }

  console.log(`Found ${files.length} migration(s)`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`Running migration: ${file}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`✔ Migration applied: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`✖ Migration failed: ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .then(() => {
    console.log("All migrations completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration process failed");
    console.error(err);
    process.exit(1);
  });
