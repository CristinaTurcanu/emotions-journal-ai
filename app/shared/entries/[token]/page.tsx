import { notFound } from "next/navigation";
import {
  getSharedEntryByToken,
  parseBodySensations,
} from "@/lib/queries/entries";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function SharedEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const entry = getSharedEntryByToken(token);

  if (!entry) notFound();

  const sensations = parseBodySensations(entry.body_sensations);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          A shared moment
        </h1>
        <time dateTime={entry.created_at} className="text-xs text-slate-500">
          {dateFormatter.format(new Date(entry.created_at))}
        </time>
      </header>

      <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
              {entry.core_emotion}
            </span>
            {entry.nuance && (
              <span className="text-base text-slate-700">{entry.nuance}</span>
            )}
          </div>
          <span
            className="text-sm font-medium text-slate-500"
            aria-label={`Intensity ${entry.intensity} of 5`}
          >
            {entry.intensity}/5
          </span>
        </div>

        {sensations.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-slate-500">
              Body sensations
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {sensations.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-sm text-slate-700"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.need && (
          <p className="text-sm text-slate-700">
            <span className="text-slate-500">Need:</span> {entry.need}
          </p>
        )}
      </article>

      <footer className="text-center text-xs text-slate-500">
        Shared from Emotions Journal
      </footer>
    </main>
  );
}
