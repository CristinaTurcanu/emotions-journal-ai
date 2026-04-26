import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/actions/entries", () => ({
  deleteEntryAction: Object.assign(vi.fn(), {
    bind: () => async () => {},
  }),
}));

import { EntryListItem } from "@/components/features/entries/EntryListItem";

const baseProps = {
  id: "entry-1",
  coreEmotion: "Joy",
  nuance: "content",
  intensity: 4,
  bodySensations: '["Warm face","Tingling hands"]',
  need: "rest",
  createdAt: "2026-04-26T10:00:00.000Z",
  isShared: 0,
  shareToken: null as string | null,
};

describe("EntryListItem", () => {
  it("renders core emotion, nuance, intensity, sensations, and need", () => {
    const html = renderToStaticMarkup(<EntryListItem {...baseProps} />);
    expect(html).toContain("Joy");
    expect(html).toContain("content");
    expect(html).toContain("4/5");
    expect(html).toContain("Warm face");
    expect(html).toContain("Tingling hands");
    expect(html).toContain("rest");
    expect(html).toContain('href="/entries/entry-1/edit"');
  });

  it("omits the nuance line when nuance is null", () => {
    const html = renderToStaticMarkup(
      <EntryListItem {...baseProps} nuance={null} />,
    );
    expect(html).not.toContain("content");
    expect(html).toContain("Joy");
  });

  it("omits the need line when need is null", () => {
    const html = renderToStaticMarkup(
      <EntryListItem {...baseProps} need={null} />,
    );
    expect(html).not.toContain(">Need:</span>");
  });

  it("does not render sensations list when JSON is empty", () => {
    const html = renderToStaticMarkup(
      <EntryListItem {...baseProps} bodySensations="[]" />,
    );
    expect(html).not.toContain("Warm face");
  });

  it("falls back gracefully when bodySensations is malformed", () => {
    const html = renderToStaticMarkup(
      <EntryListItem {...baseProps} bodySensations="not-json" />,
    );
    expect(html).toContain("Joy");
  });

  it("shows the share link panel only when isShared=1 with a token", () => {
    const shared = renderToStaticMarkup(
      <EntryListItem {...baseProps} isShared={1} shareToken="tok-abc" />,
    );
    expect(shared).toContain("Public link is on");

    const unshared = renderToStaticMarkup(
      <EntryListItem {...baseProps} isShared={0} shareToken="tok-abc" />,
    );
    expect(unshared).not.toContain("Public link is on");

    const noToken = renderToStaticMarkup(
      <EntryListItem {...baseProps} isShared={1} shareToken={null} />,
    );
    expect(noToken).not.toContain("Public link is on");
  });

  it("uses the createdAt timestamp on a <time> element", () => {
    const html = renderToStaticMarkup(<EntryListItem {...baseProps} />);
    expect(html).toContain('dateTime="2026-04-26T10:00:00.000Z"');
  });
});
