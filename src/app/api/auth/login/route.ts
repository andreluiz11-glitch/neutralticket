import { NextResponse } from "next/server";
import { AuthError, authenticateOrCreateUser } from "@/lib/auth";
import { signJwt } from "@/lib/jwt";

const COOKIE_NAME = "nt_session";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;

    const { user, created } = await authenticateOrCreateUser(body);

    const token = await signJwt({
      sub: user.id,
      email: user.email,
    });

    const res = NextResponse.json(
      {
        message: created
          ? "Conta criada e acesso liberado."
          : "Login realizado com sucesso.",
        created,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: created ? 201 : 200 }
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("AUTH_LOGIN_ERROR", error);
    return NextResponse.json(
      { error: "Não foi possível acessar sua conta agora. Tente novamente." },
      { status: 503 }
    );
  }
}
