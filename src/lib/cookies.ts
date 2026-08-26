import { cookies } from "next/headers";
const COOKIE_NAME = "nt_session";

export async function getSessionCookie() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value || null;
}
