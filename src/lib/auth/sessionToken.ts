import { createHmac, timingSafeEqual } from "crypto";

// Pure, Next-agnostic token sign/verify logic — no `next/headers` import —
// so it can run both in server code (via session.ts) and in proxy.ts
// (which reads/writes cookies through NextRequest/NextResponse instead).

export const SESSION_COOKIE_NAME = "tec_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — see .env.example");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** userId.expiresAt.signature — signed so the cookie can't be edited into someone else's account. */
export function buildSessionToken(userId: string, expiresAt: number): string {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export interface SessionTokenPayload {
  userId: string;
  expiresAt: number;
}

export function parseSessionToken(token: string): SessionTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;

  const expected = sign(`${userId}.${expiresAtRaw}`);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return { userId, expiresAt };
}
