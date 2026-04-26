import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/actions/auth", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
}));

import { AuthForm } from "@/components/features/auth/AuthForm";

describe("AuthForm", () => {
  it("renders sign-in copy in login mode and omits the name field", () => {
    const html = renderToStaticMarkup(<AuthForm mode="login" />);
    expect(html).toContain("Welcome back");
    expect(html).toContain(">Sign in</button>");
    expect(html).not.toContain('id="name"');
    expect(html).toContain('href="/login?mode=register"');
  });

  it("renders register copy and a name field in register mode", () => {
    const html = renderToStaticMarkup(<AuthForm mode="register" />);
    expect(html).toContain("Create your account");
    expect(html).toContain(">Create account</button>");
    expect(html).toContain('id="name"');
    expect(html).toContain('href="/login?mode=login"');
  });

  it("requires email and password and enforces minLength=8 on password", () => {
    const html = renderToStaticMarkup(<AuthForm mode="login" />);
    expect(html).toMatch(/id="email"[^>]*type="email"[^>]*required/);
    expect(html).toMatch(/id="password"[^>]*minLength="8"/);
  });
});
