import { describe, expect, it, vi, beforeEach } from "vitest";

const getSessionCookie = vi.fn();

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: (req: unknown) => getSessionCookie(req),
}));

vi.mock("next/server", () => {
  class NextResponse {
    static redirect(url: URL) {
      return { type: "redirect", url: url.toString() };
    }
    static next() {
      return { type: "next" };
    }
  }
  return { NextResponse, NextRequest: class {} };
});

import { config, middleware } from "@/middleware";

beforeEach(() => {
  getSessionCookie.mockReset();
});

function makeRequest(pathname: string) {
  return { url: `http://localhost:3000${pathname}` } as never;
}

describe("middleware", () => {
  it("redirects to /login when there is no session cookie", () => {
    getSessionCookie.mockReturnValue(undefined);
    const result = middleware(makeRequest("/journal"));
    expect(result).toEqual({
      type: "redirect",
      url: "http://localhost:3000/login",
    });
  });

  it("passes through when a session cookie exists", () => {
    getSessionCookie.mockReturnValue("session-token-value");
    const result = middleware(makeRequest("/journal"));
    expect(result).toEqual({ type: "next" });
  });

  it("preserves the request origin when redirecting", () => {
    getSessionCookie.mockReturnValue(null);
    const result = middleware({
      url: "https://example.test/entries/abc",
    } as never);
    expect(result).toEqual({
      type: "redirect",
      url: "https://example.test/login",
    });
  });
});

describe("middleware config matcher", () => {
  it("guards the app route groups but not the public ones", () => {
    expect(config.matcher).toEqual([
      "/journal/:path*",
      "/entries/:path*",
      "/notes/:path*",
      "/patterns/:path*",
    ]);
    expect(config.matcher).not.toContain("/shared/:path*");
    expect(config.matcher).not.toContain("/login");
  });
});
