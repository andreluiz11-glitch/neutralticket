import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

export async function getSessionCookie() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value || null;
}

export async function getAuthenticatedUserId() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const payload = await verifyJwt(token).catch(() => null);
  const subject = payload?.sub;

  return typeof subject === "string" && subject.length > 0 ? subject : null;
}
