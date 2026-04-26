import { requireUser } from "@/lib/auth-guards";
import { EntryForm } from "@/components/features/entries/EntryForm";

export default async function NewEntryPage() {
  await requireUser();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">New entry</h1>
        <p className="text-sm text-slate-600">
          Take a moment. Name what&apos;s present.
        </p>
      </header>
      <EntryForm />
    </section>
  );
}
