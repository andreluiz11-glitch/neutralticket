import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

const COOKIE_NAME = "nt_session";

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null });

    const payload: any = await verifyJwt(token).catch(() => null);
    if (!payload?.sub) return NextResponse.json({ user: null });

    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json({ user: user || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
