import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link
          href="/journal"
          className="flex items-center gap-2 rounded-md text-slate-900 transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
          aria-label="Emotions Journal — go to journal"
        >
          <Logo className="h-7 w-7 text-slate-900" />
          <span className="text-lg font-semibold tracking-tight">
            Emotions Journal
          </span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5v-15Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
