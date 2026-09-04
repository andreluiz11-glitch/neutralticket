import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { getOrderById } from "@/lib/orders";
import { getTicketsByOrderId } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    if (!(await hasValidAdminSession())) {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const tickets = await getTicketsByOrderId(orderId);

    return NextResponse.json({
      order,
      tickets,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível carregar os ingressos.",
      },
      { status: 500 }
    );
  }
}
