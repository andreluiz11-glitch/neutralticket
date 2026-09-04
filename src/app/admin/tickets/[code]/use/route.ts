import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { getTicketByCode, markTicketAsUsed } from "@/lib/tickets";

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

    const currentTicket = await getTicketByCode(code);

    if (!currentTicket) {
      return NextResponse.json(
        { error: "Ingresso não encontrado." },
        { status: 404 }
      );
    }

    if (currentTicket.status === "USED") {
      return NextResponse.json(
        {
          ticket: currentTicket,
          error: "Este ingresso já foi utilizado.",
        },
        { status: 400 }
      );
    }

    if (currentTicket.status === "CANCELED") {
      return NextResponse.json(
        {
          ticket: currentTicket,
          error: "Este ingresso está cancelado.",
        },
        { status: 400 }
      );
    }

    const ticket = await markTicketAsUsed(code);

    return NextResponse.json({
      ticket,
      message: "Ingresso marcado como utilizado.",
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
