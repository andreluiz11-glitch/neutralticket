import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || null;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const payload = await verifyJwt(token).catch(() => null);

    if (!payload?.sub) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: String(payload.sub),
      },
      include: {
        items: true,
        tickets: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Falha ao carregar pedidos.",
      },
      { status: 500 }
    );
  }
}