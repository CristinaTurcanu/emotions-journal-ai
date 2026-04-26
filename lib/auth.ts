import { betterAuth } from "better-auth";
import { db } from "./db";
import { nextCookies } from "better-auth/next-js";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
}

export const auth = betterAuth({
  database: db,
  emailAndPassword: { enabled: true },
  secret,
  plugins: [nextCookies()],
});
