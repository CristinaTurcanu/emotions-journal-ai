"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AuthFormState,
} from "@/lib/actions/auth";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    isRegister ? signUpAction : signInAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-slate-600">
          {isRegister
            ? "Start logging feelings, sensations, and needs."
            : "Sign in to continue your journal."}
        </p>
      </header>

      {isRegister && (
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={inputClass}
        />
      </Field>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isRegister ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={`/login?mode=${isRegister ? "login" : "register"}`}
          className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
          replace
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
