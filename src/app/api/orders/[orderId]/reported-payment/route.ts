import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/cookies";
import { getOrderByIdForUser, updateOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Pedido não informado." },
      { status: 400 }
    );
  }

  const currentOrder = await getOrderByIdForUser(orderId, userId);

  if (!currentOrder) {
    return NextResponse.json(
      { error: "Pedido não encontrado." },
      { status: 404 }
    );
  }

  if (currentOrder.status === "PAID" || currentOrder.status === "TICKET_SENT") {
    return NextResponse.json({ order: currentOrder });
  }

  if (currentOrder.status === "PAYMENT_REPORTED") {
    return NextResponse.json({ order: currentOrder });
  }

  if (currentOrder.status === "CANCELED") {
    return NextResponse.json(
      { error: "Este pedido está cancelado." },
      { status: 409 }
    );
  }

  const order = await updateOrderStatus(orderId, "PAYMENT_REPORTED");

  return NextResponse.json({ order });
}
