import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/cookies";
import { createPicPayOrder } from "@/lib/orders";
import { createPicPayCheckout, isPicPayConfigured } from "@/lib/picpay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function validCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  const digit = (size: number) => {
    const total = cpf.slice(0, size).split("").reduce((sum, value, index) => sum + Number(value) * (size + 1 - index), 0);
    return (total * 10) % 11 % 10;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export async function GET() {
  return NextResponse.json({ enabled: isPicPayConfigured() });
}

export async function POST(request: Request) {
  if (!isPicPayConfigured()) {
    return NextResponse.json({ error: "Pagamento com cartão ainda não está disponível." }, { status: 503 });
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Entre na sua conta para finalizar a compra." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const cpf = String(body.cpf || "").replace(/\D/g, "");
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (!/^[\p{L} &\d]{3,255}$/u.test(name) || !validCpf(cpf) || !/^\d{2}9?\d{8}$/.test(phone)) {
    return NextResponse.json({ error: "Informe nome, CPF e celular válidos para o PicPay." }, { status: 400 });
  }

  let orderId: string | null = null;
  try {
    const order = await createPicPayOrder({ userId, items: body.items, customerName: name });
    orderId = order.id;
    const checkout = await createPicPayCheckout({
      amountCents: Math.round(order.amount * 100), orderId: order.id,
      name, email: order.customer.email, cpf, phone,
    });
    await prisma.order.update({ where: { id: order.id }, data: { providerCheckoutId: checkout.id } });
    return NextResponse.json({ orderId: order.id, checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    if (orderId) await prisma.order.update({ where: { id: orderId }, data: { status: "canceled" } }).catch(() => null);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível iniciar o PicPay." }, { status: 400 });
  }
}
