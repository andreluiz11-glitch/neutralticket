import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { markTicketAsUsed } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ code: string }>;
  }
) {
  try {
    if (!(await hasValidAdminSession())) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Código do ingresso não informado." },
        { status: 400 }
      );
    }

    const ticket = await markTicketAsUsed(code);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ingresso não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticket,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível validar o ingresso.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  return NextResponse.json(
    {
      status: "ok",
      message: "Rota de validação de ingresso ativa.",
    },
    { status: 200 }
  );
}
