"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";

const NUANCES_BY_EMOTION = {
  Happiness: [
    "Happy", "Optimistic", "Inspired", "Hopeful", "Trusting", "Intimate",
    "Sensitive", "Peaceful", "Thankful", "Loving", "Powerful", "Creative",
    "Courageous", "Accepted", "Valued", "Respected", "Proud", "Confident",
    "Successful",
  ],
  Sadness: [
    "Sad", "Hurt", "Embarrassed", "Disappointed", "Depressed", "Unseen",
    "Empty", "Guilty", "Remorseful", "Ashamed", "Despair", "Grief",
    "Powerless", "Vulnerable", "Victimised", "Fragile", "Lonely", "Isolated",
    "Abandoned",
  ],
  Fear: [
    "Fearful", "Scared", "Helpless", "Frightened", "Anxious", "Concerned",
    "Worried", "Insecure", "Inadequate", "Inferior", "Weak", "Worthless",
    "Insignificant", "Rejected", "Excluded", "Persecuted", "Threatened",
    "Nervous", "Exposed",
  ],
  Anger: [
    "Angry", "Let down", "Betrayed", "Resentful", "Humiliated", "Disrespected",
    "Ridiculed", "Bitter", "Indignant", "Violated", "Mad", "Furious",
    "Jealous", "Aggressive", "Provoked", "Hostile", "Frustrated", "Infuriated",
    "Annoyed",
  ],
  Surprise: [
    "Surprised", "Excited", "Energetic", "Eager", "Amazed", "Awe",
    "Astonished", "Confused", "Perplexed", "Disillusioned", "Startled",
    "Dismayed", "Shocked",
  ],
  Disgust: [
    "Disgusted", "Disapproving", "Judgmental", "Condemned", "Uncomfortable",
    "Appalled", "Revolted", "Awful", "Nauseated", "Detestable", "Repelled",
    "Horrified",
  ],
  Bad: [
    "Bad", "Tired", "Unfocused", "Sleepy", "Stressed", "Out of control",
    "Overwhelmed", "Busy", "Rushed", "Pressured", "Bored", "Apathetic",
    "Indifferent",
  ],
} as const;

const CORE_EMOTIONS = Object.keys(NUANCES_BY_EMOTION) as Array<
  keyof typeof NUANCES_BY_EMOTION
>;

const entrySchema = z
  .object({
    core_emotion: z.enum(CORE_EMOTIONS as [string, ...string[]]),
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
  })
  .refine(
    (data) =>
      data.nuance === null ||
      (NUANCES_BY_EMOTION[
        data.core_emotion as keyof typeof NUANCES_BY_EMOTION
      ] as readonly string[]).includes(data.nuance),
    { message: "Nuance must match the selected core emotion", path: ["nuance"] },
  );

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
