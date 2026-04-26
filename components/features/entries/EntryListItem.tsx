import Link from "next/link";
import { deleteEntryAction } from "@/lib/actions/entries";
import { parseBodySensations } from "@/lib/queries/entries";
import { DeleteConfirmButton } from "@/components/ui/DeleteConfirmButton";
import { ShareLinkPanel } from "@/components/ui/ShareLinkPanel";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function EntryListItem({
  id,
  coreEmotion,
  nuance,
  intensity,
  bodySensations,
  need,
  createdAt,
  isShared,
  shareToken,
}: {
  id: string;
  coreEmotion: string;
  nuance: string | null;
  intensity: number;
  bodySensations: string;
  need: string | null;
  createdAt: string;
  isShared: number;
  shareToken: string | null;
}) {
  const sensations = parseBodySensations(bodySensations);
  const boundDelete = deleteEntryAction.bind(null, id);

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
            {coreEmotion}
          </span>
          {nuance && (
            <span className="text-sm text-slate-700">{nuance}</span>
          )}
        </div>
        <span
          className="text-xs font-medium text-slate-500"
          aria-label={`Intensity ${intensity} of 5`}
        >
          {intensity}/5
        </span>
      </div>

      {sensations.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {sensations.map((s) => (
            <li
              key={s}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {need && (
        <p className="text-sm text-slate-700">
          <span className="text-slate-500">Need:</span> {need}
        </p>
      )}

      {isShared === 1 && shareToken && (
        <ShareLinkPanel path={`/shared/entries/${shareToken}`} compact />
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <time dateTime={createdAt} className="text-xs text-slate-500">
          {dateFormatter.format(new Date(createdAt))}
        </time>
        <div className="flex items-center gap-2">
          <Link
            href={`/entries/${id}/edit`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Edit
          </Link>
          <DeleteConfirmButton
            deleteAction={boundDelete}
            entityLabel="entry"
          />
        </div>
      </div>
    </li>
  );
}
