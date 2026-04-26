import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prepareCalls: string[] = [];
const stmtCalls: { sql: string; method: string; args: unknown[] }[] = [];
const requireUser = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`__redirect__:${url}`);
});
const revalidatePath = vi.fn();

let nextGet: (...args: unknown[]) => unknown = () => undefined;

vi.mock("@/lib/db", () => ({
  db: {
    prepare(sql: string) {
      prepareCalls.push(sql);
      return {
        run: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "run", args });
          return { changes: 1, lastInsertRowid: 1 };
        },
        get: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "get", args });
          return nextGet(...args);
        },
        all: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "all", args });
          return [];
        },
      };
    },
    exec: vi.fn(),
  },
}));

vi.mock("@/lib/auth-guards", () => ({
  requireUser: () => requireUser(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));

import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
} from "@/lib/actions/entries";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fd(entries: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) v.forEach((vv) => f.append(k, vv));
    else f.append(k, v);
  }
  return f;
}

beforeEach(() => {
  prepareCalls.length = 0;
  stmtCalls.length = 0;
  requireUser.mockReset();
  redirect.mockClear();
  revalidatePath.mockClear();
  nextGet = () => undefined;
  requireUser.mockResolvedValue({ id: "user-1", name: "Test" });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`__redirect__:${url}`);
}

describe("createEntryAction", () => {
  it("inserts an entry, revalidates, and redirects to /journal", async () => {
    const form = fd({
      core_emotion: "Joy",
      nuance: "content",
      intensity: "3",
      body_sensations: ["Warm face", "Tingling hands"],
      need: "rest",
    });

    await expectRedirect(createEntryAction(undefined, form), "/journal");

    const insert = stmtCalls.find((c) => c.method === "run");
    expect(insert).toBeDefined();
    expect(insert!.sql).toMatch(/INSERT INTO entries/);
    expect(insert!.args[0]).toMatch(UUID_RE);
    expect(insert!.args[1]).toBe("user-1");
    expect(insert!.args[2]).toBe("Joy");
    expect(insert!.args[3]).toBe("content");
    expect(insert!.args[4]).toBe(3);
    expect(insert!.args[5]).toBe(
      JSON.stringify(["Warm face", "Tingling hands"]),
    );
    expect(insert!.args[6]).toBe("rest");
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
  });

  it("trims optional fields to null when empty", async () => {
    const form = fd({
      core_emotion: "Sadness",
      nuance: "",
      intensity: "1",
      need: "",
    });

    await expectRedirect(createEntryAction(undefined, form), "/journal");

    const insert = stmtCalls.find((c) => c.method === "run");
    expect(insert!.args[3]).toBeNull();
    expect(insert!.args[6]).toBeNull();
    expect(insert!.args[5]).toBe("[]");
  });

  it("returns a validation error for an invalid core emotion", async () => {
    const form = fd({ core_emotion: "Bogus", intensity: "3" });
    const result = await createEntryAction(undefined, form);
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(redirect).not.toHaveBeenCalled();
    expect(stmtCalls).toHaveLength(0);
  });

  it("returns a validation error for intensity out of range", async () => {
    const form = fd({ core_emotion: "Joy", intensity: "9" });
    const result = await createEntryAction(undefined, form);
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a validation error when nuance is too long", async () => {
    const form = fd({
      core_emotion: "Joy",
      intensity: "3",
      nuance: "x".repeat(121),
    });
    const result = await createEntryAction(undefined, form);
    expect(result).toMatchObject({ error: expect.stringMatching(/short/i) });
  });
});

describe("updateEntryAction", () => {
  it("updates the entry and reuses an existing share token when sharing stays on", async () => {
    nextGet = () => ({ share_token: "existing-tok" });

    const form = fd({
      core_emotion: "Joy",
      intensity: "4",
      is_shared: "on",
    });

    await expectRedirect(
      updateEntryAction("entry-1", undefined, form),
      "/journal",
    );

    const update = stmtCalls.find(
      (c) => c.method === "run" && c.sql.includes("UPDATE entries"),
    );
    expect(update).toBeDefined();
    expect(update!.args[5]).toBe(1);
    expect(update!.args[6]).toBe("existing-tok");
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/shared/entries/existing-tok",
    );
  });

  it("generates a new share token when toggling sharing on for the first time", async () => {
    nextGet = () => ({ share_token: null });

    const form = fd({
      core_emotion: "Joy",
      intensity: "2",
      is_shared: "on",
    });

    await expectRedirect(
      updateEntryAction("entry-1", undefined, form),
      "/journal",
    );

    const update = stmtCalls.find(
      (c) => c.method === "run" && c.sql.includes("UPDATE entries"),
    );
    expect(update!.args[5]).toBe(1);
    expect(update!.args[6]).toMatch(UUID_RE);
  });

  it("keeps the existing share token but flips is_shared to 0 when sharing is unticked", async () => {
    nextGet = () => ({ share_token: "old-tok" });

    const form = fd({ core_emotion: "Joy", intensity: "3" });

    await expectRedirect(
      updateEntryAction("entry-1", undefined, form),
      "/journal",
    );

    const update = stmtCalls.find(
      (c) => c.method === "run" && c.sql.includes("UPDATE entries"),
    );
    expect(update!.args[5]).toBe(0);
    expect(update!.args[6]).toBe("old-tok");
  });

  it("returns 'Entry not found' when no row matches id+user", async () => {
    nextGet = () => undefined;
    const form = fd({ core_emotion: "Joy", intensity: "3" });

    const result = await updateEntryAction("missing", undefined, form);
    expect(result).toEqual({ error: "Entry not found" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a validation error and does not query the db", async () => {
    const form = fd({ core_emotion: "Bogus", intensity: "3" });
    const result = await updateEntryAction("entry-1", undefined, form);
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(stmtCalls).toHaveLength(0);
  });
});

describe("deleteEntryAction", () => {
  it("deletes scoped to user and redirects to /journal", async () => {
    await expectRedirect(deleteEntryAction("entry-1"), "/journal");

    const del = stmtCalls.find((c) => c.method === "run");
    expect(del!.sql).toMatch(/DELETE FROM entries WHERE id = \? AND user_id = \?/);
    expect(del!.args).toEqual(["entry-1", "user-1"]);
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
  });
});
