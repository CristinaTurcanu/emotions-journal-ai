import { requireUser } from "@/lib/auth-guards";

export default async function EntryDetailPage() {
  await requireUser();
  return <p>Entry detail page</p>;
}
