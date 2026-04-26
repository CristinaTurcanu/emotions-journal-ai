import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StmtBehavior = {
  all?: (...args: unknown[]) => unknown[];
  get?: (...args: unknown[]) => unknown;
  run?: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
};

const prepareCalls: string[] = [];
const stmtCalls: { sql: string; method: string; args: unknown[] }[] = [];
let nextBehavior: StmtBehavior = {};

vi.mock("@/lib/db", () => ({
  db: {
    prepare(sql: string) {
      prepareCalls.push(sql);
      return {
        all: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "all", args });
          return nextBehavior.all ? nextBehavior.all(...args) : [];
        },
        get: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "get", args });
          return nextBehavior.get ? nextBehavior.get(...args) : undefined;
        },
        run: (...args: unknown[]) => {
          stmtCalls.push({ sql, method: "run", args });
          return nextBehavior.run
            ? nextBehavior.run(...args)
            : { changes: 0, lastInsertRowid: 0 };
        },
      };
    },
    exec: vi.fn(),
  },
}));

import {
  getEntryForUser,
  getSharedEntryByToken,
  listEntriesForUser,
  parseBodySensations,
} from "@/lib/queries/entries";

beforeEach(() => {
  prepareCalls.length = 0;
  stmtCalls.length = 0;
  nextBehavior = {};
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseBodySensations", () => {
  it("parses a JSON string array", () => {
    expect(parseBodySensations('["Tight chest","Warm face"]')).toEqual([
      "Tight chest",
      "Warm face",
    ]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseBodySensations("not-json")).toEqual([]);
  });

  it("returns empty array when JSON is not an array", () => {
    expect(parseBodySensations('{"a":1}')).toEqual([]);
  });

  it("filters out non-string entries", () => {
    expect(parseBodySensations('["ok",1,null,true,"again"]')).toEqual([
      "ok",
      "again",
    ]);
  });

  it("handles empty array", () => {
    expect(parseBodySensations("[]")).toEqual([]);
  });
});

describe("listEntriesForUser", () => {
  it("queries entries scoped to the user, ordered by created_at DESC", () => {
    const rows = [{ id: "e1" }, { id: "e2" }];
    nextBehavior = { all: () => rows };

    const result = listEntriesForUser("user-1");

    expect(result).toBe(rows);
    expect(prepareCalls).toHaveLength(1);
    expect(prepareCalls[0]).toMatch(/FROM entries/);
    expect(prepareCalls[0]).toMatch(/WHERE user_id = \?/);
    expect(prepareCalls[0]).toMatch(/ORDER BY created_at DESC/);
    expect(stmtCalls[0]).toMatchObject({ method: "all", args: ["user-1"] });
  });

  it("returns whatever the db returns (empty list)", () => {
    nextBehavior = { all: () => [] };
    expect(listEntriesForUser("user-1")).toEqual([]);
  });
});

describe("getEntryForUser", () => {
  it("returns the row when found, scoped by id and user", () => {
    const row = { id: "e1", user_id: "u1" };
    nextBehavior = { get: () => row };

    const result = getEntryForUser("e1", "u1");

    expect(result).toBe(row);
    expect(prepareCalls[0]).toMatch(/WHERE id = \? AND user_id = \?/);
    expect(stmtCalls[0]).toMatchObject({
      method: "get",
      args: ["e1", "u1"],
    });
  });

  it("returns null when no row found", () => {
    nextBehavior = { get: () => undefined };
    expect(getEntryForUser("missing", "u1")).toBeNull();
  });
});

describe("getSharedEntryByToken", () => {
  it("returns the row when the token resolves to a shared entry", () => {
    const row = { id: "e1", core_emotion: "Joy" };
    nextBehavior = { get: () => row };

    const result = getSharedEntryByToken("tok-123");

    expect(result).toBe(row);
    expect(prepareCalls[0]).toMatch(/WHERE share_token = \? AND is_shared = 1/);
    expect(stmtCalls[0]).toMatchObject({
      method: "get",
      args: ["tok-123"],
    });
  });

  it("returns null when no shared entry matches", () => {
    nextBehavior = { get: () => undefined };
    expect(getSharedEntryByToken("nope")).toBeNull();
  });
});
