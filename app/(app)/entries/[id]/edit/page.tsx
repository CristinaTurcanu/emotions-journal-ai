import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import {
  getEntryForUser,
  parseBodySensations,
} from "@/lib/queries/entries";
import { EntryForm } from "@/components/features/entries/EntryForm";
import { ShareLinkPanel } from "@/components/ui/ShareLinkPanel";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const entry = getEntryForUser(id, user.id);

  if (!entry) notFound();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit entry</h1>
        <p className="text-sm text-slate-600">Update any of the fields below.</p>
      </header>
      <EntryForm
        entry={{
          id: entry.id,
          core_emotion: entry.core_emotion,
          nuance: entry.nuance,
          intensity: entry.intensity,
          body_sensations: parseBodySensations(entry.body_sensations),
          need: entry.need,
          is_shared: entry.is_shared,
        }}
      />
        {entry.is_shared === 1 && entry.share_token && (
          <ShareLinkPanel path={`/shared/entries/${entry.share_token}`} />
        )}
    </section>
  );
}
