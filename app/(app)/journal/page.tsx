import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guards";
import { listEntriesForUser } from "@/lib/queries/entries";
import { EntryListItem } from "@/components/features/entries/EntryListItem";

export default async function JournalPage() {
  const user = await requireUser();

  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-slate-600">
            A quiet space to log what you&apos;re feeling.
          </p>
        </div>
        <Link
          href="/entries/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <span aria-hidden="true">+</span>
          Add new entry
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Your entries
        </h2>
        <Suspense fallback={<ListSkeleton />}>
          <EntriesList userId={user.id} />
        </Suspense>
      </section>
    </section>
  );
}

async function EntriesList({ userId }: { userId: string }) {
  const entries = listEntriesForUser(userId);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
        No entries yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((e) => (
        <EntryListItem
          key={e.id}
          id={e.id}
          coreEmotion={e.core_emotion}
          nuance={e.nuance}
          intensity={e.intensity}
          bodySensations={e.body_sensations}
          need={e.need}
          createdAt={e.created_at}
          isShared={e.is_shared}
          shareToken={e.share_token}
        />
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white/60"
        />
      ))}
    </ul>
  );
}
