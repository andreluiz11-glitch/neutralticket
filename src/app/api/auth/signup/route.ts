import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import { signJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignupBody;

    const name = body.name?.trim() || null;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Email já cadastrado." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = await signJwt({
      sub: user.id,
      email: user.email,
    });

    const res = NextResponse.json(
      {
        message: "Usuário criado com sucesso!",
        user,
      },
      { status: 201 }
    );

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
        : "Erro no cadastro.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}