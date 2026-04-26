import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const headers = vi.fn(async () => new Headers({ cookie: "session=x" }));
const redirect = vi.fn((url: string) => {
  throw new Error(`__redirect__:${url}`);
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: () => headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

beforeEach(async () => {
  vi.resetModules();
  getSession.mockReset();
  redirect.mockClear();
  headers.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentSession", () => {
  it("calls auth.api.getSession with the request headers", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const { getCurrentSession } = await import("@/lib/auth-guards");

    const session = await getCurrentSession();
    expect(session).toEqual({ user: { id: "u1" } });
    expect(getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

});

describe("requireUser", () => {
  it("returns session.user when authenticated", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", name: "A" } });
    const { requireUser } = await import("@/lib/auth-guards");

    await expect(requireUser()).resolves.toEqual({ id: "u1", name: "A" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    getSession.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/auth-guards");

    await expect(requireUser()).rejects.toThrow("__redirect__:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});

describe("redirectIfAuthenticated", () => {
  it("redirects to /journal by default when a session exists", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const { redirectIfAuthenticated } = await import("@/lib/auth-guards");

    await expect(redirectIfAuthenticated()).rejects.toThrow(
      "__redirect__:/journal",
    );
  });

  it("redirects to a custom destination when provided", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const { redirectIfAuthenticated } = await import("@/lib/auth-guards");

    await expect(redirectIfAuthenticated("/somewhere")).rejects.toThrow(
      "__redirect__:/somewhere",
    );
  });

  it("does nothing when there is no session", async () => {
    getSession.mockResolvedValue(null);
    const { redirectIfAuthenticated } = await import("@/lib/auth-guards");

    await expect(redirectIfAuthenticated()).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
