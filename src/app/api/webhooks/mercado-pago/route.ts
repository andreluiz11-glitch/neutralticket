import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { fulfillOrderAndSendTickets } from "@/lib/orderFulfillment";
import { getMercadoPagoPayment, isMercadoPagoConfigured } from "@/lib/mercadoPago";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function validSignature(request: Request, dataId: string) {
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=");
      return [key, value.join("=")];
    })
  );
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received || !requestId || !dataId) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", process.env.MERCADO_PAGO_WEBHOOK_SECRET!)
    .update(manifest)
    .digest("hex");
  const left = Buffer.from(received, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ error: "Integração desativada." }, { status: 503 });
  }

  let body: { type?: string; action?: string; data?: { id?: string | number } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataId = String(body.data?.id || url.searchParams.get("data.id") || "").trim();
  if (!validSignature(request, dataId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const eventType = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
  if (eventType !== "payment") return NextResponse.json({ received: true });

  const payment = await getMercadoPagoPayment(dataId);
  if (payment.status !== "approved") return NextResponse.json({ received: true });

  const orderId = String(payment.external_reference || "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "mercado_pago" || order.status === "canceled") {
    return NextResponse.json({ error: "Pedido incompatível." }, { status: 409 });
  }

  const paidCents = Math.round(Number(payment.transaction_amount || 0) * 100);
  if (paidCents !== order.total || payment.currency_id !== "BRL") {
    return NextResponse.json({ error: "Valor do pagamento divergente." }, { status: 409 });
  }

  if (order.status === "ticket_sent") return NextResponse.json({ received: true });

  await fulfillOrderAndSendTickets({
    orderId: order.id,
    baseUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ingresseclub.com").replace(/\/$/, ""),
  });

  return NextResponse.json({ received: true });
}
