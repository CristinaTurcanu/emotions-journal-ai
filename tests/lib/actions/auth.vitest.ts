import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInEmail = vi.fn();
const signUpEmail = vi.fn();
const signOut = vi.fn();
const headers = vi.fn(async () => new Headers({ cookie: "session=x" }));
const redirect = vi.fn((url: string) => {
  throw new Error(`__redirect__:${url}`);
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: (...args: unknown[]) => signInEmail(...args),
      signUpEmail: (...args: unknown[]) => signUpEmail(...args),
      signOut: (...args: unknown[]) => signOut(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

vi.mock("next/headers", () => ({
  headers: () => headers(),
}));

import {
  signInAction,
  signOutAction,
  signUpAction,
} from "@/lib/actions/auth";

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

beforeEach(() => {
  signInEmail.mockReset();
  signUpEmail.mockReset();
  signOut.mockReset();
  redirect.mockClear();
  headers.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`__redirect__:${url}`);
}

describe("signInAction", () => {
  it("calls auth.signInEmail with parsed credentials and redirects to /journal", async () => {
    signInEmail.mockResolvedValue({ user: { id: "u1" } });
    const form = fd({ email: "a@b.com", password: "longenough" });

    await expectRedirect(signInAction(undefined, form), "/journal");

    expect(signInEmail).toHaveBeenCalledWith({
      body: { email: "a@b.com", password: "longenough" },
    });
  });

  it("returns a validation error for a bad email", async () => {
    const form = fd({ email: "not-email", password: "longenough" });
    const result = await signInAction(undefined, form);
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(signInEmail).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a validation error for a too-short password", async () => {
    const form = fd({ email: "a@b.com", password: "short" });
    const result = await signInAction(undefined, form);
    expect(result).toMatchObject({ error: expect.stringMatching(/8/) });
  });

  it("returns 'Invalid email or password' when auth throws", async () => {
    signInEmail.mockRejectedValue(new Error("boom"));
    const form = fd({ email: "a@b.com", password: "longenough" });
    const result = await signInAction(undefined, form);
    expect(result).toEqual({ error: "Invalid email or password" });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("signUpAction", () => {
  it("calls auth.signUpEmail with parsed inputs and redirects to /journal", async () => {
    signUpEmail.mockResolvedValue({ user: { id: "u1" } });
    const form = fd({
      name: "Alice",
      email: "a@b.com",
      password: "longenough",
    });

    await expectRedirect(signUpAction(undefined, form), "/journal");

    expect(signUpEmail).toHaveBeenCalledWith({
      body: { name: "Alice", email: "a@b.com", password: "longenough" },
    });
  });

  it("requires a name", async () => {
    const form = fd({
      name: "",
      email: "a@b.com",
      password: "longenough",
    });
    const result = await signUpAction(undefined, form);
    expect(result).toMatchObject({
      error: expect.stringMatching(/name/i),
    });
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("surfaces the auth error message when sign up fails", async () => {
    signUpEmail.mockRejectedValue(new Error("Email already in use"));
    const form = fd({
      name: "Alice",
      email: "a@b.com",
      password: "longenough",
    });

    const result = await signUpAction(undefined, form);
    expect(result).toEqual({ error: "Email already in use" });
  });

  it("falls back to a generic error when the thrown value is not an Error", async () => {
    signUpEmail.mockRejectedValue("string-error");
    const form = fd({
      name: "Alice",
      email: "a@b.com",
      password: "longenough",
    });
    const result = await signUpAction(undefined, form);
    expect(result).toEqual({ error: "Sign up failed" });
  });
});

describe("signOutAction", () => {
  it("calls auth.signOut with the request headers and redirects to /login", async () => {
    signOut.mockResolvedValue(undefined);

    await expectRedirect(signOutAction(), "/login");

    expect(headers).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });
});
