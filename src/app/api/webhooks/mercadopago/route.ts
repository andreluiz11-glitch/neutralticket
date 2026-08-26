import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return NextResponse.json({ ok: true });

    const url = new URL(req.url);
    const queryId = url.searchParams.get("id");
    const queryTopic = url.searchParams.get("topic");

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    let paymentId: string | null = null;

    // Formato v2
    if (body?.type === "payment" && body?.data?.id) paymentId = String(body.data.id);
    // Fallback (antigo)
    if (!paymentId && queryTopic === "payment" && queryId) paymentId = String(queryId);

    if (!paymentId) return NextResponse.json({ ok: true });

    // Busca o pagamento
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!payRes.ok) return NextResponse.json({ ok: true });

    const payment = await payRes.json();
    const status: string = payment?.status;              // approved | pending | rejected | ...
    const externalRef: string | undefined = payment?.external_reference; // nosso order.id

    if (!externalRef) return NextResponse.json({ ok: true });

    if (status === "approved") {
      await prisma.order.update({ where: { id: externalRef }, data: { status: "paid" } });
    } else if (status === "rejected") {
      await prisma.order.update({ where: { id: externalRef }, data: { status: "canceled" } });
    } else {
      await prisma.order.update({ where: { id: externalRef }, data: { status: "pending" } });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
