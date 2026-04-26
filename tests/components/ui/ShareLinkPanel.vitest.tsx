import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ShareLinkPanel } from "@/components/ui/ShareLinkPanel";

describe("ShareLinkPanel", () => {
  it("renders the heading and copy button (full)", () => {
    const html = renderToStaticMarkup(
      <ShareLinkPanel path="/shared/entries/abc" />,
    );
    expect(html).toContain("Public link is on");
    expect(html).toContain("Copy link");
    expect(html).toContain("Anyone with this link");
  });

  it("hides the explainer paragraph in compact mode", () => {
    const html = renderToStaticMarkup(
      <ShareLinkPanel path="/shared/entries/abc" compact />,
    );
    expect(html).toContain("Public link is on");
    expect(html).not.toContain("Anyone with this link");
  });

  it("renders the URL input with an empty initial value (filled by useEffect on the client)", () => {
    const html = renderToStaticMarkup(
      <ShareLinkPanel path="/shared/entries/abc" />,
    );
    expect(html).toContain('value=""');
    expect(html).toMatch(/readOnly/i);
  });
});
