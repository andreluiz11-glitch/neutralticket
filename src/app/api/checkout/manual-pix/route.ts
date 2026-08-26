import { NextResponse } from "next/server";
import { createManualPixOrder } from "@/lib/orders";
import { buildPixPayload, generatePixQrCodeDataUrl } from "@/lib/pix";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pixKey = process.env.PIX_KEY;
    const receiverName = process.env.PIX_RECEIVER_NAME || "KAYO BRANDAO";
    const receiverCity = process.env.PIX_RECEIVER_CITY || "SAO PAULO";

    if (!pixKey) {
      return NextResponse.json(
        {
          error: "Chave Pix não configurada no .env.local.",
        },
        { status: 500 }
      );
    }

    const order = await createManualPixOrder({
      customer: {
        name: body?.customer?.name || null,
        email: body?.customer?.email || "",
      },
      items: body?.items,
    });

    const pixCopyPaste = buildPixPayload({
      key: pixKey,
      receiverName,
      receiverCity,
      amount: order.amount,
      txid: order.pixTxid,
      description: `Pedido ${order.id}`,
    });

    const qrCodeDataUrl = await generatePixQrCodeDataUrl(pixCopyPaste);

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      pix: {
        key: pixKey,
        txid: order.pixTxid,
        copyPaste: pixCopyPaste,
        qrCodeDataUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Não foi possível gerar o Pix.",
      },
      { status: 400 }
    );
  }
}