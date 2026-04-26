import { db } from "@/lib/db";

export type EntryRow = {
  id: string;
  core_emotion: string;
  nuance: string | null;
  intensity: number;
  body_sensations: string;
  need: string | null;
  is_shared: number;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

export function listEntriesForUser(userId: string): EntryRow[] {
  return db
    .prepare(
      `SELECT id, core_emotion, nuance, intensity, body_sensations, need,
              is_shared, share_token, created_at, updated_at
         FROM entries
        WHERE user_id = ?
        ORDER BY created_at DESC`,
    )
    .all(userId) as EntryRow[];
}

export function getEntryForUser(id: string, userId: string): EntryRow | null {
  const row = db
    .prepare(
      `SELECT id, core_emotion, nuance, intensity, body_sensations, need,
              is_shared, share_token, created_at, updated_at
         FROM entries
        WHERE id = ? AND user_id = ?`,
    )
    .get(id, userId) as EntryRow | undefined;
  return row ?? null;
}

export type SharedEntry = Pick<
  EntryRow,
  | "id"
  | "core_emotion"
  | "nuance"
  | "intensity"
  | "body_sensations"
  | "need"
  | "created_at"
>;

export function getSharedEntryByToken(token: string): SharedEntry | null {
  const row = db
    .prepare(
      `SELECT id, core_emotion, nuance, intensity, body_sensations, need, created_at
         FROM entries
        WHERE share_token = ? AND is_shared = 1`,
    )
    .get(token) as SharedEntry | undefined;
  return row ?? null;
}

export function parseBodySensations(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}
