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

  const order = await updateOrderStatus(orderId, "CANCELED");

  return NextResponse.json({ order });
}