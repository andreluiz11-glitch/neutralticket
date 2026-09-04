import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/hash";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

type AuthInput = {
  email?: string;
  password?: string;
  name?: string | null;
};

function normalizeInput(input: AuthInput) {
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const name = String(input.name || "").trim() || null;

  if (!email || !password) {
    throw new AuthError("E-mail e senha são obrigatórios.", 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("Digite um e-mail válido.", 400);
  }

  if (password.length < 6) {
    throw new AuthError("A senha deve ter pelo menos 6 caracteres.", 400);
  }

  if (password.length > 128) {
    throw new AuthError("A senha informada é muito longa.", 400);
  }

  return { email, password, name };
}

export async function authenticateOrCreateUser(input: AuthInput) {
  const { email, password, name } = normalizeInput(input);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const passwordOk = await verifyPassword(password, existingUser.passwordHash);

    if (!passwordOk) {
      throw new AuthError("Senha incorreta.", 401);
    }

    return { user: existingUser, created: false };
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    return { user, created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const racedUser = await prisma.user.findUnique({ where: { email } });
      const passwordOk = racedUser
        ? await verifyPassword(password, racedUser.passwordHash)
        : false;

      if (racedUser && passwordOk) {
        return { user: racedUser, created: false };
      }

      throw new AuthError("Este e-mail já existe com outra senha.", 409);
    }

    throw error;
  }
}
