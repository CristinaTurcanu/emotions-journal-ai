import Link from "next/link";
import { getCurrentSession } from "@/lib/auth-guards";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getCurrentSession();
  if (session) redirect("/journal");

  return (
    <main>
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 text-sm font-medium tracking-widest text-slate-600 uppercase">
          Emotions Journal
        </p>

        <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
          A quiet place for whatever you&apos;re feeling.
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-pretty text-slate-700 sm:text-lg">
          Take a breath. Name the emotion. Notice where it lives in your body.
          Small, honest check-ins, kept private and close at hand.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/login?mode=register"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
          >
            Start journaling
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-slate-700 underline-offset-4 transition hover:text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
          >
            I already have an account
          </Link>
        </div>

        <dl className="mt-16 grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <Pillar
            title="Feel"
            body="Name core emotions and the softer nuances underneath."
          />
          <Pillar
            title="Notice"
            body="Log body sensations and intensity — one to five."
          />
          <Pillar
            title="Reflect"
            body="Write private notes. Share one only when you choose."
          />
        </dl>
      </section>
    </main>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur">
      <dt className="text-sm font-semibold tracking-tight text-slate-900">
        {title}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">{body}</dd>
    </div>
  );
}
