import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPicPayMerchantDocument, isPicPayConfigured } from "@/lib/picpay";
import { fulfillOrderAndSendTickets } from "@/lib/orderFulfillment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPicPayConfigured()) return NextResponse.json({ error: "Indisponível" }, { status: 503 });
  const expected = createHash("sha256").update(process.env.PICPAY_WEBHOOK_TOKEN!).digest();
  const received = createHash("sha256").update(request.headers.get("authorization") || "").digest();
  if (!timingSafeEqual(expected, received)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (request.headers.get("event-type") !== "TransactionUpdateMessage") {
    return NextResponse.json({ ok: true });
  }
  let payload: {
    type?: string;
    merchantDocument?: string;
    data?: { status?: string; amount?: number; refundedAmount?: number; smartCheckoutId?: string | null };
  };
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (payload?.type !== "PAYMENT" || payload?.data?.status !== "PAID") {
    return NextResponse.json({ ok: true });
  }
  if (String(payload.merchantDocument || "").replace(/\D/g, "") !== getPicPayMerchantDocument()) {
    return NextResponse.json({ error: "Recebedor inválido" }, { status: 400 });
  }
  const checkoutId = payload.data?.smartCheckoutId;
  if (typeof checkoutId !== "string" || !checkoutId) {
    return NextResponse.json({ error: "Checkout não identificado" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { providerCheckoutId: checkoutId } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 503 });
  if (order.paymentMethod !== "picpay" || order.status === "canceled" || order.total !== payload.data.amount || payload.data.refundedAmount !== 0) {
    return NextResponse.json({ error: "Pedido divergente" }, { status: 409 });
  }
  if (order.status === "ticket_sent") return NextResponse.json({ ok: true });

  try {
    await fulfillOrderAndSendTickets({ orderId: order.id, baseUrl: "https://www.ingresseclub.com" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao liberar o ingresso; tente novamente" }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      enabled: isPicPayConfigured(),
    },
    { status: 200 }
  );
}
