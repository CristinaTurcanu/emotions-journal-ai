"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";

const CORE_EMOTIONS = [
  "Joy",
  "Sadness",
  "Anger",
  "Fear",
  "Surprise",
  "Disgust",
  "Love",
  "Shame",
] as const;

const entrySchema = z.object({
  core_emotion: z.enum(CORE_EMOTIONS),
  nuance: z
    .string()
    .trim()
    .max(120, "Keep the nuance short")
    .optional()
    .transform((v) => (v ? v : null)),
  intensity: z.coerce.number().int().min(1).max(5),
  body_sensations: z.array(z.string().trim().min(1)).max(20).default([]),
  need: z
    .string()
    .trim()
    .max(120, "Keep the need short")
    .optional()
    .transform((v) => (v ? v : null)),
  is_shared: z.coerce.boolean().default(false),
});

export type EntryFormState = { error?: string } | undefined;

function parseEntryForm(formData: FormData) {
  return entrySchema.safeParse({
    core_emotion: formData.get("core_emotion"),
    nuance: formData.get("nuance") ?? undefined,
    intensity: formData.get("intensity"),
    body_sensations: formData.getAll("body_sensations"),
    need: formData.get("need") ?? undefined,
    is_shared: formData.get("is_shared") === "on",
  });
}

export async function createEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await requireUser();

  const parsed = parseEntryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO entries
       (id, user_id, core_emotion, nuance, intensity, body_sensations, need, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    user.id,
    parsed.data.core_emotion,
    parsed.data.nuance,
    parsed.data.intensity,
    JSON.stringify(parsed.data.body_sensations),
    parsed.data.need,
    now,
    now,
  );

  revalidatePath("/journal");
  redirect("/journal");
}

export async function updateEntryAction(
  id: string,
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await requireUser();

  const parsed = parseEntryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = db
    .prepare(`SELECT share_token FROM entries WHERE id = ? AND user_id = ?`)
    .get(id, user.id) as { share_token: string | null } | undefined;
  if (!existing) return { error: "Entry not found" };

  const shareToken = parsed.data.is_shared
    ? (existing.share_token ?? randomUUID())
    : existing.share_token;

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE entries
        SET core_emotion = ?, nuance = ?, intensity = ?, body_sensations = ?, need = ?,
            is_shared = ?, share_token = ?, updated_at = ?
      WHERE id = ? AND user_id = ?`,
  ).run(
    parsed.data.core_emotion,
    parsed.data.nuance,
    parsed.data.intensity,
    JSON.stringify(parsed.data.body_sensations),
    parsed.data.need,
    parsed.data.is_shared ? 1 : 0,
    shareToken,
    now,
    id,
    user.id,
  );

  revalidatePath("/journal");
  if (shareToken) revalidatePath(`/shared/entries/${shareToken}`);
  redirect("/journal");
}

export async function deleteEntryAction(id: string): Promise<void> {
  const user = await requireUser();
  db.prepare(`DELETE FROM entries WHERE id = ? AND user_id = ?`).run(
    id,
    user.id,
  );
  revalidatePath("/journal");
  redirect("/journal");
}
