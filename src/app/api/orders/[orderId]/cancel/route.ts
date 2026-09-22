import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/cookies";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Pedido não informado." },
      { status: 400 }
    );
  }

  const currentOrder = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!currentOrder) {
    return NextResponse.json(
      { error: "Pedido não encontrado." },
      { status: 404 }
    );
  }

  if (currentOrder.status === "canceled") {
    return NextResponse.json({ order: currentOrder, result: "already_canceled" });
  }

  const payload = await request.json().catch(() => ({}));
  const reason = String(payload?.reason || "Solicitação realizada pelo cliente").trim().slice(0, 1000);
  const canCancelImmediately = currentOrder.status === "pending";

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(canCancelImmediately ? { status: "canceled" as const } : {}),
      cancellationRequestedAt: new Date(),
      cancellationReason: reason,
    },
  });

  return NextResponse.json({
    order,
    result: canCancelImmediately ? "canceled" : "review_requested",
  });
}
