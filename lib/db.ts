import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = resolve(process.env.DB_PATH ?? "data/journal.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { create: true });

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS "entries" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "user_id" TEXT NOT NULL,
    "core_emotion" TEXT NOT NULL,
    "nuance" TEXT,
    "intensity" INTEGER NOT NULL CHECK ("intensity" BETWEEN 1 AND 5),
    "body_sensations" TEXT NOT NULL DEFAULT '[]',
    "need" TEXT,
    "is_shared" INTEGER NOT NULL DEFAULT 0,
    "share_token" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "notes" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_id" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "is_shared" INTEGER NOT NULL DEFAULT 0,
    "share_token" TEXT UNIQUE,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_entry ON notes(entry_id);
`);

const entryCols = db
  .prepare(`PRAGMA table_info("entries")`)
  .all() as { name: string }[];
const entryColNames = new Set(entryCols.map((c) => c.name));
if (!entryColNames.has("is_shared")) {
  db.exec(
    `ALTER TABLE "entries" ADD COLUMN "is_shared" INTEGER NOT NULL DEFAULT 0`,
  );
}
if (!entryColNames.has("share_token")) {
  db.exec(`ALTER TABLE "entries" ADD COLUMN "share_token" TEXT`);
}
db.exec(
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_share_token ON entries(share_token) WHERE share_token IS NOT NULL`,
);
