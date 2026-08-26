import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
  safeCompare,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const pin = String(body?.pin || "");
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      return NextResponse.json(
        {
          ok: false,
          message: "ADMIN_PIN não configurado no .env.local.",
        },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          message: "ADMIN_SESSION_SECRET não configurado no .env.local.",
        },
        { status: 500 }
      );
    }

    if (!safeCompare(pin, adminPin)) {
      return NextResponse.json(
        {
          ok: false,
          message: "PIN inválido.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Acesso liberado.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao validar acesso administrativo.",
      },
      { status: 500 }
    );
  }
}