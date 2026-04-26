import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/actions/auth", () => ({
  signOutAction: vi.fn(),
}));

import { Header } from "@/components/ui/Header";

describe("Header", () => {
  it("links the brand to /journal and renders a sign-out form", () => {
    const html = renderToStaticMarkup(<Header />);
    expect(html).toContain('href="/journal"');
    expect(html).toContain("Emotions Journal");
    expect(html).toContain(">Sign out</button>");
    expect(html).toContain("<form");
  });
});
