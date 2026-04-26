import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/actions/entries", () => ({
  createEntryAction: vi.fn(),
  updateEntryAction: Object.assign(vi.fn(), {
    bind: () => vi.fn(),
  }),
}));

import { EntryForm } from "@/components/features/entries/EntryForm";

describe("EntryForm", () => {
  it("renders all seven core emotions from the feelings wheel", () => {
    const html = renderToStaticMarkup(<EntryForm />);
    for (const emotion of [
      "Happiness",
      "Sadness",
      "Fear",
      "Anger",
      "Surprise",
      "Disgust",
      "Bad",
    ]) {
      expect(html).toContain(`>${emotion}</option>`);
    }
  });

  it("renders nuance options for the selected core emotion in edit mode", () => {
    const html = renderToStaticMarkup(
      <EntryForm
        entry={{
          id: "e1",
          core_emotion: "Sadness",
          nuance: "Lonely",
          intensity: 2,
          body_sensations: [],
          need: null,
          is_shared: 0,
        }}
      />,
    );
    expect(html).toContain(`>Lonely</option>`);
    expect(html).toContain(`>Grief</option>`);
    expect(html).not.toContain(`>Happy</option>`);
  });

  it("disables the nuance dropdown when no core emotion is selected", () => {
    const html = renderToStaticMarkup(<EntryForm />);
    expect(html).toMatch(/id="nuance"[^>]*disabled=""/);
  });

  it("renders 5 intensity radios with intensity 3 selected by default", () => {
    const html = renderToStaticMarkup(<EntryForm />);
    const radioMatches = html.match(/name="intensity"/g) ?? [];
    expect(radioMatches).toHaveLength(5);
    expect(html).toMatch(/checked=""[^>]*value="3"/);
  });

  it("renders all 8 body sensation checkboxes", () => {
    const html = renderToStaticMarkup(<EntryForm />);
    for (const s of [
      "Tight chest",
      "Shallow breath",
      "Heavy shoulders",
      "Warm face",
      "Knot in stomach",
      "Racing heart",
      "Tingling hands",
      "Heavy limbs",
    ]) {
      expect(html).toContain(`<span>${s}</span>`);
    }
  });

  it("shows 'Save entry' label in create mode and hides the share toggle", () => {
    const html = renderToStaticMarkup(<EntryForm />);
    expect(html).toContain(">Save entry</button>");
    expect(html).not.toContain('name="is_shared"');
  });

  it("shows 'Save changes' label in edit mode and renders the share toggle", () => {
    const html = renderToStaticMarkup(
      <EntryForm
        entry={{
          id: "e1",
          core_emotion: "Sadness",
          nuance: "Lonely",
          intensity: 2,
          body_sensations: ["Warm face"],
          need: "rest",
          is_shared: 1,
        }}
      />,
    );
    expect(html).toContain(">Save changes</button>");
    expect(html).toContain('name="is_shared"');
    expect(html).toMatch(/checked=""[^>]*name="is_shared"|name="is_shared"[^>]*checked/);
  });

  it("pre-fills nuance, need, intensity, and selected sensations in edit mode", () => {
    const html = renderToStaticMarkup(
      <EntryForm
        entry={{
          id: "e1",
          core_emotion: "Happiness",
          nuance: "Confident",
          intensity: 5,
          body_sensations: ["Warm face", "Tingling hands"],
          need: "connection",
          is_shared: 0,
        }}
      />,
    );
    expect(html).toMatch(/value="Confident"[^>]*selected=""/);
    expect(html).toMatch(/id="need"[^>]*value="connection"/);
    expect(html).toMatch(/checked=""[^>]*value="5"/);
    const checkedSensations = html.match(
      /name="body_sensations" checked=""/g,
    );
    expect(checkedSensations).toHaveLength(2);
  });
});
