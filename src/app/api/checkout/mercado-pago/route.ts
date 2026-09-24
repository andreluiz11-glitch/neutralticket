import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/cookies";
import { createMercadoPagoCheckout, isMercadoPagoConfigured } from "@/lib/mercadoPago";
import { createMercadoPagoOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: isMercadoPagoConfigured() });
}

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Pagamento com cartão ainda não está disponível." },
      { status: 503 }
    );
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Entre na sua conta para finalizar a compra." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  let orderId: string | null = null;
  try {
    const order = await createMercadoPagoOrder({ userId, items: body.items });
    orderId = order.id;
    const checkout = await createMercadoPagoCheckout(order);

    await prisma.order.update({
      where: { id: order.id },
      data: { providerCheckoutId: checkout.id },
    });

    return NextResponse.json({ orderId: order.id, checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    if (orderId) {
      await prisma.order
        .update({ where: { id: orderId }, data: { status: "canceled" } })
        .catch(() => null);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar o Mercado Pago.",
      },
      { status: 400 }
    );
  }
}
