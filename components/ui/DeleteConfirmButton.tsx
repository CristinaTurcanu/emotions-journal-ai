"use client";

import { useRef } from "react";

export function DeleteConfirmButton({
  deleteAction,
  entityLabel = "item",
}: {
  deleteAction: () => Promise<void>;
  entityLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Delete
      </button>
      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto h-fit w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Delete this {entityLabel}?
            </h2>
            <p className="text-sm text-slate-600">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Cancel
            </button>
            <form action={deleteAction}>
              <button
                type="submit"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Confirm delete
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
