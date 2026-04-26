"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import {
  createEntryAction,
  updateEntryAction,
  type EntryFormState,
} from "@/lib/actions/entries";

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

const BODY_SENSATIONS = [
  "Tight chest",
  "Shallow breath",
  "Heavy shoulders",
  "Warm face",
  "Knot in stomach",
  "Racing heart",
  "Tingling hands",
  "Heavy limbs",
] as const;

const INTENSITY_LEVELS = [1, 2, 3, 4, 5] as const;

export type EntryInput = {
  id: string;
  core_emotion: string;
  nuance: string | null;
  intensity: number;
  body_sensations: string[];
  need: string | null;
  is_shared: number;
};

export function EntryForm({ entry }: { entry?: EntryInput }) {
  const isEdit = entry !== undefined;
  const action = isEdit
    ? updateEntryAction.bind(null, entry.id)
    : createEntryAction;

  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(
    action,
    undefined,
  );
  const errorId = useId();

  const initialEmotion =
    entry?.core_emotion && entry.core_emotion in NUANCES_BY_EMOTION
      ? (entry.core_emotion as keyof typeof NUANCES_BY_EMOTION)
      : "";
  const [selectedEmotion, setSelectedEmotion] = useState<
    keyof typeof NUANCES_BY_EMOTION | ""
  >(initialEmotion);
  const availableNuances = selectedEmotion
    ? NUANCES_BY_EMOTION[selectedEmotion]
    : [];
  const initialNuance =
    entry?.nuance && availableNuances.includes(entry.nuance as never)
      ? entry.nuance
      : "";

  const sensationSet = new Set(entry?.body_sensations ?? []);
  const cancelHref = "/journal";

  return (
    <form
      action={formAction}
      aria-describedby={state?.error ? errorId : undefined}
      className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <Field label="Core emotion" htmlFor="core_emotion" required>
        <select
          id="core_emotion"
          name="core_emotion"
          required
          value={selectedEmotion}
          onChange={(e) =>
            setSelectedEmotion(
              e.target.value as keyof typeof NUANCES_BY_EMOTION | "",
            )
          }
          className={inputClass}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {CORE_EMOTIONS.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Nuance"
        htmlFor="nuance"
        hint="A more specific word for what you feel (optional)."
      >
        <select
          id="nuance"
          name="nuance"
          disabled={!selectedEmotion}
          defaultValue={initialNuance}
          key={selectedEmotion}
          className={inputClass}
        >
          <option value="">
            {selectedEmotion ? "Choose one…" : "Pick a core emotion first"}
          </option>
          {availableNuances.map((nuance) => (
            <option key={nuance} value={nuance}>
              {nuance}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-700">
          Intensity
        </legend>
        <p className="text-xs text-slate-500">
          From 1 (barely there) to 5 (all-consuming).
        </p>
        <div
          role="radiogroup"
          aria-label="Intensity from 1 to 5"
          className="flex gap-2"
        >
          {INTENSITY_LEVELS.map((n) => (
            <label
              key={n}
              className="group relative flex-1 cursor-pointer rounded-md border border-slate-300 bg-white text-center text-sm font-medium text-slate-700 transition hover:border-slate-900 has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:text-white"
            >
              <input
                type="radio"
                name="intensity"
                value={n}
                required
                defaultChecked={entry ? entry.intensity === n : n === 3}
                className="peer sr-only"
              />
              <span className="block py-2.5">{n}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-700">
          Body sensations
        </legend>
        <p className="text-xs text-slate-500">
          Pick any that apply right now.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BODY_SENSATIONS.map((sensation) => (
            <label
              key={sensation}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 has-checked:border-slate-900 has-checked:bg-slate-900 has-checked:text-white"
            >
              <input
                type="checkbox"
                name="body_sensations"
                value={sensation}
                defaultChecked={sensationSet.has(sensation)}
                className="sr-only"
              />
              <span>{sensation}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Unmet need"
        htmlFor="need"
        hint="What might you be needing? (optional)"
      >
        <input
          id="need"
          name="need"
          type="text"
          maxLength={120}
          autoComplete="off"
          placeholder="e.g. rest, connection, clarity"
          defaultValue={entry?.need ?? ""}
          className={inputClass}
        />
      </Field>

      {isEdit && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_shared"
              defaultChecked={entry.is_shared === 1}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
            />
            Shareable via public link
          </label>
          <p className="pl-6 text-xs text-slate-500">
            Anyone with the link can read this entry. Untick to disable the
            link.
          </p>
        </div>
      )}

      {state?.error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-slate-400">
            *
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
