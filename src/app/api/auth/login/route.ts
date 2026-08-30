import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { signJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const passwordHash = await hashPassword(password);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
      });
    } else {
      const passwordOk = await verifyPassword(
        password,
        user.passwordHash
      );

      if (!passwordOk) {
        return NextResponse.json(
          { error: "Senha incorreta." },
          { status: 401 }
        );
      }
    }

    const token = await signJwt({
      sub: user.id,
      email: user.email,
    });

    const res = NextResponse.json({
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro no login.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}