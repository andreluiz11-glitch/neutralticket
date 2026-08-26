import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Pedido não informado." },
      { status: 400 }
    );
  }

  const currentOrder = await getOrderById(orderId);

  if (!currentOrder) {
    return NextResponse.json(
      { error: "Pedido não encontrado." },
      { status: 404 }
    );
  }

  if (currentOrder.status === "PAID" || currentOrder.status === "TICKET_SENT") {
    return NextResponse.json({ order: currentOrder });
  }

  const order = await updateOrderStatus(orderId, "PAYMENT_REPORTED");

  return NextResponse.json({ order });
}