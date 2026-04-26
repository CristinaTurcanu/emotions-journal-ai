import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { DeleteConfirmButton } from "@/components/ui/DeleteConfirmButton";

describe("DeleteConfirmButton", () => {
  it("renders the trigger button and a dialog confirm form", () => {
    const action = vi.fn(async () => {});
    const html = renderToStaticMarkup(
      <DeleteConfirmButton deleteAction={action} entityLabel="entry" />,
    );

    expect(html).toContain(">Delete</button>");
    expect(html).toContain("Delete this entry?");
    expect(html).toContain(">Confirm delete</button>");
    expect(html).toContain(">Cancel</button>");
  });

  it("uses the default entityLabel when none is provided", () => {
    const html = renderToStaticMarkup(
      <DeleteConfirmButton deleteAction={async () => {}} />,
    );
    expect(html).toContain("Delete this item?");
  });
});
