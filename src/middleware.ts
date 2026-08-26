import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./lib/jwt";

const PROTECTED = ["/admin"]; // adicione outras se quiser

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isProtected = PROTECTED.some((p) => url.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("nt_session")?.value;
  if (!token) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    await verifyJwt(token);
    return NextResponse.next();
  } catch {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
