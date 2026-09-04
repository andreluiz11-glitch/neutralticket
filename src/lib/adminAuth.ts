import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_panel_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 4;

function getAdminSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET não configurado.");
  }

  return secret;
}

function signValue(value: string) {
  return createHmac("sha256", getAdminSecret()).update(value).digest("hex");
}

export function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function createAdminToken() {
  const createdAt = Date.now().toString();
  const signature = signValue(createdAt);

  return `${createdAt}.${signature}`;
}

export function isValidAdminToken(token?: string) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [createdAt, signature] = parts;
  const createdAtNumber = Number(createdAt);

  if (!createdAt || !signature || Number.isNaN(createdAtNumber)) {
    return false;
  }

  const now = Date.now();
  const maxAgeMs = ADMIN_SESSION_MAX_AGE * 1000;

  if (now - createdAtNumber > maxAgeMs) {
    return false;
  }

  try {
    const expectedSignature = signValue(createdAt);
    return safeCompare(signature, expectedSignature);
  } catch {
    return false;
  }
}

export async function hasValidAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;

  return isValidAdminToken(token);
}
