import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/hash";
import { signJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    const token = await signJwt({ sub: user.id, email: user.email });

    const res = NextResponse.json({ message: "Login realizado com sucesso!" });
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro no login." }, { status: 500 });
  }
}
