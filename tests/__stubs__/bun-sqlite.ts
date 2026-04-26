type Stmt = {
  run: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
  all: (...args: unknown[]) => unknown[];
  get: (...args: unknown[]) => unknown;
};

export class Database {
  constructor() {}
  exec() {}
  prepare(): Stmt {
    return {
      run: () => ({ changes: 0, lastInsertRowid: 0 }),
      all: () => [],
      get: () => undefined,
    };
  }
  close() {}
}

const stub = { Database };
export default stub;
