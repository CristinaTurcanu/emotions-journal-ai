process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-must-be-at-least-32-chars-long";
process.env.DB_PATH = process.env.DB_PATH ?? ":memory:";
