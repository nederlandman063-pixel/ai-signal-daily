import { timingSafeEqual } from "node:crypto";

export function verifyBearer(header: string | null, secret = process.env.EDITORIAL_API_SECRET): boolean {
  if (!secret || secret.length < 24 || !header?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7), "utf8");
  const expected = Buffer.from(secret, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function isDuplicateError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as {code?: string}).code === "23505");
}
